from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)  # Coordinator, Financer, Principal

    events = relationship("Event", back_populates="coordinator")
    approvals = relationship("Approval", back_populates="approver")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    coordinator_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(Text)
    status = Column(String, default="Draft") # Draft, AI_Audited, Pending_Financer, Pending_Principal, Approved, Rejected
    total_requested_budget = Column(Float, default=0.0)
    total_ai_suggested_budget = Column(Float, default=0.0)
    coordinator_remarks = Column(Text, nullable=True)
    financer_allocated_budget = Column(Float, nullable=True)
    attachment_url = Column(String, nullable=True)

    coordinator = relationship("User", back_populates="events")
    budget_items = relationship("BudgetItem", back_populates="event", cascade="all, delete-orphan")
    ai_audit = relationship("AIAudit", back_populates="event", uselist=False, cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="event", cascade="all, delete-orphan")

class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    item_name = Column(String)
    quantity = Column(Integer, default=1)
    requested_amount = Column(Float)
    ai_suggested_amount = Column(Float, nullable=True)
    ai_reasoning = Column(Text, nullable=True)

    event = relationship("Event", back_populates="budget_items")

class AIAudit(Base):
    __tablename__ = "ai_audit"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    historical_context = Column(Text, nullable=True)
    market_research_data = Column(Text, nullable=True)
    compliance_report = Column(Text, nullable=True)

    event = relationship("Event", back_populates="ai_audit")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))
    decision = Column(String) # Approved, Rejected
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="approvals")
    approver = relationship("User", back_populates="approvals")
