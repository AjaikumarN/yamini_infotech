from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from pydantic import BaseModel
from database import get_db
from models import ReceptionCall, User, UserRole, CallOutcome, ProductCondition, Complaint
from auth import get_current_user

router = APIRouter(prefix="/api/calls", tags=["calls"])

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

class MonthlyFollowUpCreate(BaseModel):
    parent_call_id: int
    notes: Optional[str] = None
    product_condition: Optional[str] = None  # For PURCHASED customers: "WORKING_FINE" or "SERVICE_NEEDED"
    call_outcome: Optional[str] = None  # For INTERESTED_BUY_LATER: can convert to "PURCHASED" or "NOT_INTERESTED"

class CallResponse(BaseModel):
    id: int
    customer_name: str
    phone: str
    email: Optional[str]
    address: Optional[str]
    product_name: str
    call_type: str
    notes: Optional[str]
    call_outcome: str
    requires_monthly_followup: bool
    next_followup_date: Optional[date]
    last_followup_date: Optional[date]
    followup_count: int
    product_condition: Optional[str]
    service_complaint_created: bool
    service_complaint_id: Optional[int]
    parent_call_id: Optional[int]
    is_followup_call: bool
    call_date: date
    call_time: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class CallStats(BaseModel):
    today_calls: int
    daily_target: int = 40
    completion_percentage: float
    not_interested_count: int
    interested_buy_later_count: int
    purchased_count: int
    pending_monthly_followups: int
    todays_followups: int

# ============= HELPER FUNCTIONS =============

def calculate_next_followup_date(current_date: date = None) -> date:
    """Calculate next month's follow-up date"""
    if current_date is None:
        current_date = date.today()
    return current_date + relativedelta(months=1)

def auto_schedule_monthly_followup(call: ReceptionCall):
    """Automatically schedule next month's follow-up for PURCHASED or INTERESTED_BUY_LATER customers"""
    if call.call_outcome in [CallOutcome.PURCHASED, CallOutcome.INTERESTED_BUY_LATER]:
        call.requires_monthly_followup = True
        call.next_followup_date = calculate_next_followup_date(call.call_date)

# ============= ENDPOINTS =============

@router.post("/", response_model=CallResponse)
async def create_call(
    call: CallCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new call record"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate call outcome
    if call.call_outcome not in ["NOT_INTERESTED", "INTERESTED_BUY_LATER", "PURCHASED"]:
        raise HTTPException(status_code=400, detail="Invalid call outcome")
    
    new_call = ReceptionCall(
        reception_user_id=current_user.id,
        customer_name=call.customer_name,
        phone=call.phone,
        email=call.email,
        address=call.address,
        product_name=call.product_name,
        call_type=call.call_type,
        notes=call.notes,
        call_outcome=CallOutcome[call.call_outcome],
        call_date=date.today(),
        is_followup_call=False
    )
    
    # Auto-schedule monthly follow-up if needed
    auto_schedule_monthly_followup(new_call)
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    return new_call

@router.post("/monthly-followup", response_model=CallResponse)
async def create_monthly_followup(
    followup: MonthlyFollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a monthly follow-up call record"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get parent call
    parent_call = db.query(ReceptionCall).filter(
        ReceptionCall.id == followup.parent_call_id,
        ReceptionCall.reception_user_id == current_user.id
    ).first()
    
    if not parent_call:
        raise HTTPException(status_code=404, detail="Parent call not found")
    
    # Determine the call outcome based on parent call type
    if parent_call.call_outcome == CallOutcome.PURCHASED:
        # For PURCHASED customers, check product condition
        if not followup.product_condition:
            raise HTTPException(status_code=400, detail="Product condition required for purchased customer follow-up")
        
        if followup.product_condition not in ["WORKING_FINE", "SERVICE_NEEDED"]:
            raise HTTPException(status_code=400, detail="Invalid product condition")
        
        new_call = ReceptionCall(
            reception_user_id=current_user.id,
            customer_name=parent_call.customer_name,
            phone=parent_call.phone,
            email=parent_call.email,
            address=parent_call.address,
            product_name=parent_call.product_name,
            call_type="Monthly Follow-up (Purchased)",
            notes=followup.notes,
            call_outcome=CallOutcome.PURCHASED,
            product_condition=ProductCondition[followup.product_condition],
            parent_call_id=parent_call.id,
            is_followup_call=True,
            call_date=date.today()
        )
        
        # If service needed, create service complaint
        if followup.product_condition == "SERVICE_NEEDED":
            # Generate unique ticket number
            import random
            import string
            ticket_no = f"SR{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"
            
            complaint = Complaint(
                ticket_no=ticket_no,
                phone=parent_call.phone,
                customer_name=parent_call.customer_name,
                email=parent_call.email,
                address=parent_call.address,
                machine_model=parent_call.product_name,
                fault_description=f"Service needed - identified during monthly follow-up call. {followup.notes or ''}",
                priority="NORMAL",
                status="ASSIGNED",
                assigned_to=None,
                created_at=datetime.utcnow()
            )
            db.add(complaint)
            db.flush()  # Get complaint ID
            
            new_call.service_complaint_created = True
            new_call.service_complaint_id = complaint.id
        
        # Schedule next month's follow-up
        auto_schedule_monthly_followup(new_call)
        
    elif parent_call.call_outcome == CallOutcome.INTERESTED_BUY_LATER:
        # For INTERESTED_BUY_LATER customers, they can convert to PURCHASED or NOT_INTERESTED
        if not followup.call_outcome:
            raise HTTPException(status_code=400, detail="Call outcome required for interested customer follow-up")
        
        if followup.call_outcome not in ["NOT_INTERESTED", "INTERESTED_BUY_LATER", "PURCHASED"]:
            raise HTTPException(status_code=400, detail="Invalid call outcome")
        
        new_call = ReceptionCall(
            reception_user_id=current_user.id,
            customer_name=parent_call.customer_name,
            phone=parent_call.phone,
            email=parent_call.email,
            address=parent_call.address,
            product_name=parent_call.product_name,
            call_type="Monthly Follow-up (Interest Check)",
            notes=followup.notes,
            call_outcome=CallOutcome[followup.call_outcome],
            parent_call_id=parent_call.id,
            is_followup_call=True,
            call_date=date.today()
        )
        
        # If still interested or purchased, schedule next follow-up
        auto_schedule_monthly_followup(new_call)
    
    else:
        raise HTTPException(status_code=400, detail="Cannot create follow-up for NOT_INTERESTED customers")
    
    # Update parent call
    parent_call.last_followup_date = date.today()
    parent_call.followup_count += 1
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    return new_call

@router.get("/stats", response_model=CallStats)
async def get_call_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily call statistics for current reception user"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = date.today()
    
    # Get today's calls for this reception user (exclude follow-up calls)
    today_calls = db.query(ReceptionCall).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.call_date == today,
        ReceptionCall.is_followup_call == False  # Only count original calls, not follow-ups
    ).all()
    
    total_today = len(today_calls)
    not_interested = len([c for c in today_calls if c.call_outcome == CallOutcome.NOT_INTERESTED])
    interested_buy_later = len([c for c in today_calls if c.call_outcome == CallOutcome.INTERESTED_BUY_LATER])
    purchased = len([c for c in today_calls if c.call_outcome == CallOutcome.PURCHASED])
    
    # Get pending monthly follow-ups
    pending_followups = db.query(ReceptionCall).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.requires_monthly_followup == True,
        ReceptionCall.next_followup_date.isnot(None)
    ).count()
    
    # Get today's follow-ups
    todays_followups = db.query(ReceptionCall).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.requires_monthly_followup == True,
        ReceptionCall.next_followup_date <= today
    ).count()
    
    completion_percentage = (total_today / 40) * 100 if total_today > 0 else 0
    
    return CallStats(
        today_calls=total_today,
        completion_percentage=round(completion_percentage, 1),
        not_interested_count=not_interested,
        interested_buy_later_count=interested_buy_later,
        purchased_count=purchased,
        pending_monthly_followups=pending_followups,
        todays_followups=todays_followups
    )

@router.get("/history", response_model=List[CallResponse])
async def get_call_history(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all call history - shows all calls for admin/reception to see complete picture"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Show ALL calls (from all users) so reception/admin can see complete history
    calls = db.query(ReceptionCall).order_by(
        ReceptionCall.call_time.desc()
    ).limit(limit).all()
    
    return calls

@router.get("/monthly-followups", response_model=List[CallResponse])
async def get_monthly_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all customers requiring monthly follow-ups (PURCHASED and INTERESTED_BUY_LATER)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the latest call for each customer phone number that requires follow-up
    # We want unique customers, not all follow-up calls
    subquery = db.query(
        ReceptionCall.phone,
        func.max(ReceptionCall.id).label('max_id')
    ).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.requires_monthly_followup == True
    ).group_by(ReceptionCall.phone).subquery()
    
    followups = db.query(ReceptionCall).join(
        subquery,
        (ReceptionCall.phone == subquery.c.phone) & (ReceptionCall.id == subquery.c.max_id)
    ).order_by(ReceptionCall.next_followup_date.asc()).all()
    
    return followups

@router.get("/monthly-followups/today", response_model=List[CallResponse])
async def get_todays_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get follow-ups due today or overdue"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = date.today()
    
    # Get the latest call for each customer that needs follow-up today
    subquery = db.query(
        ReceptionCall.phone,
        func.max(ReceptionCall.id).label('max_id')
    ).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.requires_monthly_followup == True,
        ReceptionCall.next_followup_date <= today
    ).group_by(ReceptionCall.phone).subquery()
    
    followups = db.query(ReceptionCall).join(
        subquery,
        (ReceptionCall.phone == subquery.c.phone) & (ReceptionCall.id == subquery.c.max_id)
    ).order_by(ReceptionCall.next_followup_date.asc()).all()
    
    return followups

@router.get("/monthly-followups/purchased", response_model=List[CallResponse])
async def get_purchased_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly follow-ups for PURCHASED customers only"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    subquery = db.query(
        ReceptionCall.phone,
        func.max(ReceptionCall.id).label('max_id')
    ).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.call_outcome == CallOutcome.PURCHASED,
        ReceptionCall.requires_monthly_followup == True
    ).group_by(ReceptionCall.phone).subquery()
    
    followups = db.query(ReceptionCall).join(
        subquery,
        (ReceptionCall.phone == subquery.c.phone) & (ReceptionCall.id == subquery.c.max_id)
    ).order_by(ReceptionCall.next_followup_date.asc()).all()
    
    return followups

@router.get("/monthly-followups/interested", response_model=List[CallResponse])
async def get_interested_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly follow-ups for INTERESTED_BUY_LATER customers only"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    subquery = db.query(
        ReceptionCall.phone,
        func.max(ReceptionCall.id).label('max_id')
    ).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.call_outcome == CallOutcome.INTERESTED_BUY_LATER,
        ReceptionCall.requires_monthly_followup == True
    ).group_by(ReceptionCall.phone).subquery()
    
    followups = db.query(ReceptionCall).join(
        subquery,
        (ReceptionCall.phone == subquery.c.phone) & (ReceptionCall.id == subquery.c.max_id)
    ).order_by(ReceptionCall.next_followup_date.asc()).all()
    
    return followups

@router.get("/today", response_model=List[CallResponse])
async def get_today_calls(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all calls made today"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = date.today()
    
    # Get only original calls made today (exclude follow-up calls)
    calls = db.query(ReceptionCall).filter(
        ReceptionCall.reception_user_id == current_user.id,
        ReceptionCall.call_date == today,
        ReceptionCall.is_followup_call == False  # Only original calls, not follow-ups
    ).order_by(ReceptionCall.call_time.desc()).all()
    
    return calls

@router.get("/{call_id}/followup-history", response_model=List[CallResponse])
async def get_followup_history(
    call_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all follow-up calls for a specific customer call"""
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the parent call
    parent_call = db.query(ReceptionCall).filter(
        ReceptionCall.id == call_id,
        ReceptionCall.reception_user_id == current_user.id
    ).first()
    
    if not parent_call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Get all follow-up calls
    followups = db.query(ReceptionCall).filter(
        ReceptionCall.parent_call_id == call_id
    ).order_by(ReceptionCall.call_date.desc()).all()
    
    return followups

@router.delete("/{call_id}")
async def delete_call(
    call_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a call record (admin or owner only)"""
    call = db.query(ReceptionCall).filter(ReceptionCall.id == call_id).first()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Only admin or the reception user who created it can delete
    if current_user.role != UserRole.ADMIN and call.reception_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(call)
    db.commit()
    
    return {"message": "Call deleted successfully"}
