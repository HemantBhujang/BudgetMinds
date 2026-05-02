from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BudgetItemBase(BaseModel):
    item_name: str
    quantity: int = 1
    requested_amount: float

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItemResponse(BudgetItemBase):
    id: int
    ai_suggested_amount: Optional[float] = None
    ai_reasoning: Optional[str] = None
    
    class Config:
        from_attributes = True

class EventBase(BaseModel):
    name: str
    description: str
    coordinator_id: int

class EventCreate(EventBase):
    items: List[BudgetItemCreate]

class AIAuditResponse(BaseModel):
    historical_context: Optional[str] = None
    market_research_data: Optional[str] = None
    compliance_report: Optional[str] = None

    class Config:
        from_attributes = True

class ApprovalResponse(BaseModel):
    approver_id: int
    decision: str
    comments: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class EventResponse(EventBase):
    id: int
    status: str
    total_requested_budget: float
    total_ai_suggested_budget: float
    coordinator_remarks: Optional[str] = None
    financer_allocated_budget: Optional[float] = None
    attachment_url: Optional[str] = None
    budget_items: List[BudgetItemResponse] = []
    ai_audit: Optional[AIAuditResponse] = None
    approvals: List[ApprovalResponse] = []

    class Config:
        from_attributes = True

class ApprovalCreate(BaseModel):
    approver_id: int
    decision: str
    comments: Optional[str] = None
    
class ForwardFinancerRequest(BaseModel):
    remarks: Optional[str] = None
    attachment_url: Optional[str] = None

class FinancerApproveRequest(ApprovalCreate):
    allocated_budget: float
