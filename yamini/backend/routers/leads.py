"""
Professional CRM Lead Management - Reception Calls Module
Following industry-standard CRM design:
- All Calls page: ONE row per customer (latest state)
- Follow-ups: Tasks, not duplicate records
- Call history: Separate log table
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from pydantic import BaseModel
from database import get_db
from models import Lead, CallLog, User, UserRole, CallOutcome, ProductCondition, Complaint
from auth import get_current_user

router = APIRouter(prefix="/api/reception", tags=["reception-leads"])

# ============= SCHEMAS =============

class CallCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    product_name: str
    call_type: str
    notes: Optional[str] = None
    call_outcome: str  # "NOT_INTERESTED", "INTERESTED_BUY_LATER", "PURCHASED"

class FollowUpCreate(BaseModel):
    lead_id: int
    notes: Optional[str] = None
    product_condition: Optional[str] = None  # For PURCHASED: "WORKING_FINE" or "SERVICE_NEEDED"
    call_outcome: Optional[str] = None  # For INTERESTED_BUY_LATER: can convert

class LeadResponse(BaseModel):
    id: int
    customer_name: str
    phone: str
    email: Optional[str]
    address: Optional[str]
    product_name: str
    current_status: str
    current_outcome: str
    requires_followup: bool
    next_followup_date: Optional[date]
    last_call_date: Optional[date]
    product_condition: Optional[str]
    service_complaint_created: bool
    service_complaint_id: Optional[int]
    call_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CallLogResponse(BaseModel):
    id: int
    lead_id: int
    call_type: str
    call_outcome: str
    notes: Optional[str]
    product_condition: Optional[str]
    service_complaint_created: bool
    service_complaint_id: Optional[int]
    call_date: date
    call_time: datetime
    
    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    today_calls: int
    daily_target: int = 40
    completion_percentage: float
    not_interested_count: int
    interested_buy_later_count: int
    purchased_count: int
    total_leads: int
    pending_followups: int
    due_today_followups: int

# ============= HELPER FUNCTIONS =============

def calculate_next_followup_date(current_date: date = None) -> date:
    """Calculate next month's follow-up date"""
    if current_date is None:
        current_date = date.today()
    return current_date + relativedelta(months=1)

def auto_schedule_followup(lead: Lead):
    """Automatically schedule next follow-up for PURCHASED or INTERESTED_BUY_LATER"""
    if lead.current_outcome in [CallOutcome.PURCHASED, CallOutcome.INTERESTED_BUY_LATER]:
        lead.requires_followup = True
        lead.next_followup_date = calculate_next_followup_date(lead.last_call_date or date.today())
        lead.current_status = "FOLLOW_UP"
    else:
        lead.requires_followup = False
        lead.next_followup_date = None
        lead.current_status = "CLOSED"

# ============= ENDPOINTS =============

@router.post("/calls/log", response_model=LeadResponse)
async def log_call(
    call: CallCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a new call - Creates/Updates lead + Inserts call log.
    Professional CRM workflow: NO duplicate lead rows.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate call outcome
    if call.call_outcome not in ["NOT_INTERESTED", "INTERESTED_BUY_LATER", "PURCHASED"]:
        raise HTTPException(status_code=400, detail="Invalid call outcome")
    
    # Check if lead already exists (by phone number)
    existing_lead = db.query(Lead).filter(Lead.phone == call.phone).first()
    
    if existing_lead:
        # UPDATE EXISTING LEAD (no duplicate row)
        existing_lead.customer_name = call.customer_name  # Update name if changed
        existing_lead.email = call.email or existing_lead.email
        existing_lead.address = call.address or existing_lead.address
        existing_lead.product_name = call.product_name
        existing_lead.current_outcome = CallOutcome[call.call_outcome]
        existing_lead.last_call_date = date.today()
        existing_lead.call_count += 1
        existing_lead.updated_at = datetime.utcnow()
        
        # Auto-schedule follow-up if needed
        auto_schedule_followup(existing_lead)
        
        # INSERT CALL LOG (history)
        call_log = CallLog(
            lead_id=existing_lead.id,
            reception_user_id=current_user.id,
            call_type=call.call_type,
            call_outcome=CallOutcome[call.call_outcome],
            notes=call.notes,
            call_date=date.today()
        )
        db.add(call_log)
        db.commit()
        db.refresh(existing_lead)
        
        return existing_lead
    
    else:
        # CREATE NEW LEAD (first call)
        new_lead = Lead(
            reception_user_id=current_user.id,
            customer_name=call.customer_name,
            phone=call.phone,
            email=call.email,
            address=call.address,
            product_name=call.product_name,
            current_outcome=CallOutcome[call.call_outcome],
            current_status="NEW",
            last_call_date=date.today(),
            call_count=1
        )
        
        # Auto-schedule follow-up if needed
        auto_schedule_followup(new_lead)
        
        db.add(new_lead)
        db.flush()  # Get lead.id
        
        # INSERT CALL LOG (history)
        call_log = CallLog(
            lead_id=new_lead.id,
            reception_user_id=current_user.id,
            call_type=call.call_type,
            call_outcome=CallOutcome[call.call_outcome],
            notes=call.notes,
            call_date=date.today()
        )
        db.add(call_log)
        db.commit()
        db.refresh(new_lead)
        
        return new_lead


@router.post("/calls/followup", response_model=LeadResponse)
async def log_followup(
    followup: FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a follow-up call - Updates lead + Inserts call log.
    NO duplicate lead rows created.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get lead
    lead = db.query(Lead).filter(
        Lead.id == followup.lead_id,
        Lead.reception_user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Process based on current outcome
    if lead.current_outcome == CallOutcome.PURCHASED:
        # For PURCHASED customers: check product condition
        if not followup.product_condition:
            raise HTTPException(status_code=400, detail="Product condition required")
        
        if followup.product_condition not in ["WORKING_FINE", "SERVICE_NEEDED"]:
            raise HTTPException(status_code=400, detail="Invalid product condition")
        
        # Update lead
        lead.product_condition = ProductCondition[followup.product_condition]
        lead.last_call_date = date.today()
        lead.call_count += 1
        
        # Create service complaint if needed
        service_complaint_id = None
        service_created = False
        
        if followup.product_condition == "SERVICE_NEEDED":
            import random
            import string
            ticket_no = f"SR{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"
            
            complaint = Complaint(
                ticket_no=ticket_no,
                phone=lead.phone,
                customer_name=lead.customer_name,
                email=lead.email,
                address=lead.address,
                machine_model=lead.product_name,
                fault_description=f"Service needed - monthly follow-up. {followup.notes or ''}",
                priority="NORMAL",
                status="ASSIGNED",
                assigned_to=None
            )
            db.add(complaint)
            db.flush()
            
            service_complaint_id = complaint.id
            service_created = True
            lead.service_complaint_created = True
            lead.service_complaint_id = complaint.id
        
        # Schedule next follow-up
        auto_schedule_followup(lead)
        
        # Insert call log
        call_log = CallLog(
            lead_id=lead.id,
            reception_user_id=current_user.id,
            call_type="Monthly Follow-up (Purchased)",
            call_outcome=CallOutcome.PURCHASED,
            notes=followup.notes,
            product_condition=ProductCondition[followup.product_condition],
            service_complaint_created=service_created,
            service_complaint_id=service_complaint_id,
            call_date=date.today()
        )
        db.add(call_log)
        
    elif lead.current_outcome == CallOutcome.INTERESTED_BUY_LATER:
        # For INTERESTED: can convert to PURCHASED or NOT_INTERESTED
        if not followup.call_outcome:
            raise HTTPException(status_code=400, detail="Call outcome required")
        
        if followup.call_outcome not in ["NOT_INTERESTED", "INTERESTED_BUY_LATER", "PURCHASED"]:
            raise HTTPException(status_code=400, detail="Invalid call outcome")
        
        # Update lead
        lead.current_outcome = CallOutcome[followup.call_outcome]
        lead.last_call_date = date.today()
        lead.call_count += 1
        
        # Auto-schedule follow-up
        auto_schedule_followup(lead)
        
        # Insert call log
        call_log = CallLog(
            lead_id=lead.id,
            reception_user_id=current_user.id,
            call_type="Monthly Follow-up (Interest Check)",
            call_outcome=CallOutcome[followup.call_outcome],
            notes=followup.notes,
            call_date=date.today()
        )
        db.add(call_log)
    
    else:
        raise HTTPException(status_code=400, detail="Cannot create follow-up for NOT_INTERESTED leads")
    
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    
    return lead


@router.get("/leads", response_model=List[LeadResponse])
async def get_all_leads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get ALL leads - ONE row per customer (latest state only).
    This is what appears in 'All Calls' page. NO DUPLICATES.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    leads = db.query(Lead).filter(
        Lead.reception_user_id == current_user.id
    ).order_by(desc(Lead.updated_at)).all()
    
    return leads


@router.get("/follow-ups", response_model=List[LeadResponse])
async def get_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get customers with PENDING follow-ups only.
    This is the 'Follow-Ups' page.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    followups = db.query(Lead).filter(
        Lead.reception_user_id == current_user.id,
        Lead.requires_followup == True,
        Lead.next_followup_date.isnot(None)
    ).order_by(Lead.next_followup_date.asc()).all()
    
    return followups


@router.get("/follow-ups/due", response_model=List[LeadResponse])
async def get_due_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get follow-ups due today or overdue.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = date.today()
    
    followups = db.query(Lead).filter(
        Lead.reception_user_id == current_user.id,
        Lead.requires_followup == True,
        Lead.next_followup_date <= today
    ).order_by(Lead.next_followup_date.asc()).all()
    
    return followups


@router.get("/calls/today", response_model=List[CallLogResponse])
async def get_today_calls(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get today's call logs (history) - for activity tracking.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = date.today()
    
    call_logs = db.query(CallLog).filter(
        CallLog.reception_user_id == current_user.id,
        CallLog.call_date == today
    ).order_by(desc(CallLog.call_time)).all()
    
    return call_logs


@router.get("/calls/history/{lead_id}", response_model=List[CallLogResponse])
async def get_call_history(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete call history for a specific customer.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify lead ownership
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.reception_user_id == current_user.id
    ).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    call_logs = db.query(CallLog).filter(
        CallLog.lead_id == lead_id
    ).order_by(desc(CallLog.call_date), desc(CallLog.call_time)).all()
    
    return call_logs


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily statistics for current reception user.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = date.today()
    
    # Today's calls (from call_logs)
    today_logs = db.query(CallLog).filter(
        CallLog.reception_user_id == current_user.id,
        CallLog.call_date == today
    ).all()
    
    total_today = len(today_logs)
    not_interested = len([c for c in today_logs if c.call_outcome == CallOutcome.NOT_INTERESTED])
    interested_buy_later = len([c for c in today_logs if c.call_outcome == CallOutcome.INTERESTED_BUY_LATER])
    purchased = len([c for c in today_logs if c.call_outcome == CallOutcome.PURCHASED])
    
    # Total leads
    total_leads = db.query(Lead).filter(
        Lead.reception_user_id == current_user.id
    ).count()
    
    # Pending follow-ups
    pending_followups = db.query(Lead).filter(
        Lead.reception_user_id == current_user.id,
        Lead.requires_followup == True
    ).count()
    
    # Due today
    due_today = db.query(Lead).filter(
        Lead.reception_user_id == current_user.id,
        Lead.requires_followup == True,
        Lead.next_followup_date <= today
    ).count()
    
    completion_percentage = (total_today / 40) * 100 if total_today > 0 else 0
    
    return StatsResponse(
        today_calls=total_today,
        completion_percentage=round(completion_percentage, 1),
        not_interested_count=not_interested,
        interested_buy_later_count=interested_buy_later,
        purchased_count=purchased,
        total_leads=total_leads,
        pending_followups=pending_followups,
        due_today_followups=due_today
    )


@router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a lead (admin or owner only)"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if current_user.role != UserRole.ADMIN and lead.reception_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete associated call logs
    db.query(CallLog).filter(CallLog.lead_id == lead_id).delete()
    
    db.delete(lead)
    db.commit()
    
    return {"message": "Lead and associated call logs deleted successfully"}
