from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import firebase_admin
from firebase_admin import credentials, auth, firestore
cred = credentials.Certificate("budgetminds-7cbbc-firebase-adminsdk-fbsvc-179f18001b.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

import models, schemas
from database import engine, get_db
from agents import run_budget_audit
import os
import json

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BudgetMinds API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FIREBASE_API_KEY = "AIzaSyD66rxt-HhK7KIiduhSP5AVWaALpFSv5_w"
FIREBASE_PROJECT_ID = "budgetminds-7cbbc"

# Helper to pre-populate some test users if they don't exist
def init_db(db: Session = Depends(get_db)):
    if not db.query(models.User).first():
        users = [
            models.User(name="Alice Coordinator", email="alice@budgetminds.com", role="Coordinator"),
            models.User(name="Bob Financer", email="bob@budgetminds.com", role="Financer"),
            models.User(name="Charlie Principal", email="charlie@budgetminds.com", role="Principal")
        ]
        db.add_all(users)
        db.commit()

@app.on_event("startup")
async def startup_event():
    # Simple dependency injection workaround for startup DB init
    db = next(get_db())
    if not db.query(models.User).first():
        users = [
            models.User(name="Alice Coordinator", email="alice@budgetminds.com", role="Coordinator"),
            models.User(name="Bob Financer", email="bob@budgetminds.com", role="Financer"),
            models.User(name="Charlie Principal", email="charlie@budgetminds.com", role="Principal")
        ]
        db.add_all(users)
        db.commit()
    db.close()

# Users
@app.get("/api/users") # Returning raw rows without response_model for brevity since UserBase isn't defined
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

from pydantic import BaseModel

class HistoricEvent(BaseModel):
    eventName: str
    eventDate: str
    totalBudgetINR: float
    businessOutcome: str

@app.post("/api/admin/history")
def admin_add_history(data: HistoricEvent):
    try:
        f_db = firestore.client()
        f_db.collection('historical_events').add({
            'eventName': data.eventName,
            'eventDate': data.eventDate,
            'totalBudgetINR': data.totalBudgetINR,
            'businessOutcome': data.businessOutcome,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return {"message": "Successfully uploaded historical data"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/history")
def admin_get_history():
    try:
        f_db = firestore.client()
        docs = f_db.collection('historical_events').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(100).stream()
        history = []
        for d in docs:
            doc_data = d.to_dict()
            doc_data['id'] = d.id
            if 'timestamp' in doc_data:
                del doc_data['timestamp'] # Not easily json serializable
            history.append(doc_data)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/users")
def admin_create_user(user_data: dict, db: Session = Depends(get_db)):
    try:
        user = auth.create_user(email=user_data['email'], password=user_data['password'], display_name=user_data['name'])
        uid = user.uid

        auth.set_custom_user_claims(uid, {'role': user_data['role'], 'admin': user_data['role'] == 'Admin'})

        db_user = models.User(name=user_data['name'], email=user_data['email'], role=user_data['role'])
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        try:
            f_db = firestore.client()
            f_db.collection('users').document(uid).set({
                'role': user_data['role'],
                'name': user_data['name'],
                'email': user_data['email'],
                'backend_id': db_user.id
            })
        except Exception as e:
            print(f"Skipping Firestore user profile creation (DB likely offline): {e}")

        return {"message": "Success", "uid": uid, "backend_id": db_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Coordinator Endpoints
@app.post("/api/events/", response_model=schemas.EventResponse)
def create_event(event: schemas.EventCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Calculate total requested
    total_requested = sum(item.requested_amount for item in event.items)
    
    # Create Event
    db_event = models.Event(
        coordinator_id=event.coordinator_id,
        name=event.name,
        description=event.description,
        total_requested_budget=total_requested,
        status="Draft"
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Create Items
    db_items = []
    for item in event.items:
        db_item = models.BudgetItem(
            event_id=db_event.id,
            item_name=item.item_name,
            quantity=item.quantity,
            requested_amount=item.requested_amount
        )
        db.add(db_item)
        db_items.append(db_item)
    
    db.commit()
    
    # Trigger AI Audit in background (in production, use Celery/RabbitMQ)
    background_tasks.add_task(perform_ai_audit, db_event.id)
    
    # We refetch to get the full relations
    return db.query(models.Event).filter(models.Event.id == db_event.id).first()

def perform_ai_audit(event_id: int):
    # This runs in background
    db = next(get_db())
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event:
        db.close()
        return
        
    items = db.query(models.BudgetItem).filter(models.BudgetItem.event_id == event_id).all()
    
    # Format items for agent
    items_dict_list = [{"id": item.id, "item_name": item.item_name, "requested_amount": item.requested_amount} for item in items]
    
    try:
        if os.getenv("GOOGLE_API_KEY"):
            # Run LangGraph AI
            audit_results_state = run_budget_audit(event.description, items_dict_list)
            
            # Update items with AI suggestions
            for audit_item in audit_results_state.get("audit_results", []):
                db_item = db.query(models.BudgetItem).filter(models.BudgetItem.id == audit_item["id"]).first()
                if db_item:
                    db_item.ai_suggested_amount = audit_item["suggested_amount"]
                    db_item.ai_reasoning = audit_item["reasoning"]
            
            # Create AI Audit record
            db_audit = models.AIAudit(
                event_id=event.id,
                historical_context=audit_results_state.get("historical_context", ""),
                market_research_data=audit_results_state.get("market_research", ""),
                compliance_report=audit_results_state.get("final_report", "")
            )
            db.add(db_audit)
            
            # Update event status
            event.status = "AI_Audited"
            event.total_ai_suggested_budget = audit_results_state.get("total_suggested", 0)
            
            db.commit()
        else:
            print("WARNING: GOOGLE_API_KEY not set. Skipping real AI audit.")
            # Dummy update for testing without API key
            for item in items:
                item.ai_suggested_amount = item.requested_amount * 0.9 # Dummy 10% reduction
                item.ai_reasoning = "Dummy AI reason (No API Key)"
            event.status = "AI_Audited"
            event.total_ai_suggested_budget = event.total_requested_budget * 0.9
            db.commit()
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in perform_ai_audit: {e}")
        event.status = "Audit_Failed"
        db.commit()
    finally:
        db.close()

@app.get("/api/events/", response_model=List[schemas.EventResponse])
def get_all_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.id.desc()).all()

@app.get("/api/events/{event_id}", response_model=schemas.EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.post("/api/events/{event_id}/forward/financer", response_model=schemas.EventResponse)
def forward_to_financer(event_id: int, setup: schemas.ForwardFinancerRequest, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "AI_Audited":
        raise HTTPException(status_code=400, detail="Event must be AI Audited first")
        
    event.status = "Pending_Financer"
    event.coordinator_remarks = setup.remarks
    event.attachment_url = setup.attachment_url
    db.commit()
    db.refresh(event)
    return event

# Financer Endpoints
@app.get("/api/events/pending/financer", response_model=List[schemas.EventResponse])
def get_pending_financer(db: Session = Depends(get_db)):
    return db.query(models.Event).filter(models.Event.status == "Pending_Financer").all()

@app.post("/api/events/{event_id}/approve/financer", response_model=schemas.EventResponse)
def financer_approve(event_id: int, approval: schemas.FinancerApproveRequest, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event or event.status != "Pending_Financer":
        raise HTTPException(status_code=400, detail="Invalid event or status")
        
    db_approval = models.Approval(
        event_id=event_id,
        approver_id=approval.approver_id,
        decision="Approved",
        comments=approval.comments
    )
    db.add(db_approval)
    event.status = "Pending_Principal"
    event.financer_allocated_budget = approval.allocated_budget
    db.commit()
    db.refresh(event)
    return event

@app.post("/api/events/{event_id}/reject", response_model=schemas.EventResponse)
def reject_event(event_id: int, approval: schemas.ApprovalCreate, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    db_approval = models.Approval(
        event_id=event_id,
        approver_id=approval.approver_id,
        decision="Rejected",
        comments=approval.comments
    )
    db.add(db_approval)
    event.status = "Rejected"
    db.commit()
    db.refresh(event)
    return event

# Principal Endpoints
@app.get("/api/events/pending/principal", response_model=List[schemas.EventResponse])
def get_pending_principal(db: Session = Depends(get_db)):
    return db.query(models.Event).filter(models.Event.status == "Pending_Principal").all()

@app.post("/api/events/{event_id}/approve/principal", response_model=schemas.EventResponse)
def principal_approve(event_id: int, approval: schemas.ApprovalCreate, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event or event.status != "Pending_Principal":
        raise HTTPException(status_code=400, detail="Invalid event or status")
        
    db_approval = models.Approval(
        event_id=event_id,
        approver_id=approval.approver_id,
        decision="Approved",
        comments=approval.comments
    )
    db.add(db_approval)
    event.status = "Approved"
    db.commit()
    db.refresh(event)
    return event

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
