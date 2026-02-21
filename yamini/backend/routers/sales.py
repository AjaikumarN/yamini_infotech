from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, date
import schemas
import crud
import models
import auth
from database import get_db
import os
import shutil
from pathlib import Path
from s3_service import upload_file as s3_upload

router = APIRouter(prefix="/api/sales", tags=["Sales"])

@router.get("/")
def get_all_sales(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all sales records (for office staff and admin)"""
    # Return empty list for now - implement based on your sales table structure
    return []

@router.post("/calls")
def create_sales_call(
    call: schemas.SalesCallCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Create a sales call record (Salesman or Reception) - Attendance required for salesmen"""
    if current_user.role not in [models.UserRole.SALESMAN, models.UserRole.RECEPTION, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only salesmen or reception can create calls")
    
    # If reception is logging the call, set salesman_id to None or a default
    salesman_id = current_user.id if current_user.role == models.UserRole.SALESMAN else None
    
    return crud.create_sales_call(db=db, call=call, salesman_id=salesman_id)

@router.post("/visits")
def create_shop_visit(
    visit: schemas.ShopVisitCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Create a shop visit record - Attendance required"""
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can create visits")
    
    return crud.create_shop_visit(db=db, visit=visit, salesman_id=current_user.id)

@router.get("/my-calls")
def get_my_calls(
    user_id: Optional[int] = None,
    today_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get calls for salesman (SALESMAN or ADMIN viewing)"""
    # Allow admin to view any salesman's calls by passing user_id
    if current_user.role == models.UserRole.ADMIN and user_id:
        target_user_id = user_id
    elif current_user.role == models.UserRole.SALESMAN:
        target_user_id = current_user.id
    else:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    filter_date = None
    if today_only:
        filter_date = datetime.utcnow().replace(hour=0, minute=0, second=0)
    
    calls = crud.get_sales_calls_by_salesman(db, salesman_id=target_user_id, date=filter_date)
    
    # Return with created_at mapped from call_date for frontend compatibility
    return [
        {
            "id": call.id,
            "salesman_id": call.salesman_id,
            "customer_name": call.customer_name,
            "phone": call.phone,
            "call_type": call.call_type,
            "outcome": call.outcome,
            "notes": call.notes,
            "call_date": call.call_date,
            "created_at": call.call_date,  # Frontend expects created_at
            "call_outcome": call.call_outcome,
            "next_action_date": call.next_action_date,
            "voice_note_text": call.voice_note_text,
            "enquiry_id": call.enquiry_id,
        }
        for call in calls
    ]

@router.get("/calls")
def get_all_calls(
    today: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all calls (Reception/Admin only)"""
    if current_user.role not in [models.UserRole.RECEPTION, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(models.SalesCall)
    
    if today:
        today_date = date.today()
        query = query.filter(func.date(models.SalesCall.call_date) == today_date)
    
    calls = query.order_by(models.SalesCall.call_date.desc()).all()
    
    # Return with salesman_name and created_at for frontend compatibility
    result = []
    for call in calls:
        salesman = db.query(models.User).filter(models.User.id == call.salesman_id).first() if call.salesman_id else None
        result.append({
            "id": call.id,
            "salesman_id": call.salesman_id,
            "salesman_name": salesman.full_name if salesman else None,
            "customer_name": call.customer_name,
            "phone": call.phone,
            "call_type": call.call_type,
            "outcome": call.outcome,
            "notes": call.notes,
            "call_date": call.call_date,
            "created_at": call.call_date,  # Frontend expects created_at
            "call_outcome": call.call_outcome,
            "next_action_date": call.next_action_date,
            "voice_note_text": call.voice_note_text,
            "enquiry_id": call.enquiry_id,
        })
    return result

@router.put("/calls/{call_id}/complete")
def mark_call_completed(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mark a call as completed by changing outcome to 'completed'"""
    if current_user.role not in [models.UserRole.SALESMAN, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only salesmen can complete calls")
    
    call = db.query(models.SalesCall).filter(models.SalesCall.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Verify ownership (unless admin)
    if current_user.role == models.UserRole.SALESMAN and call.salesman_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only complete your own calls")
    
    # Update outcome to 'completed'
    call.outcome = 'completed'
    db.commit()
    db.refresh(call)
    
    return call

@router.get("/my-visits")
def get_my_visits(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get visits for current salesman"""
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    visits = db.query(models.ShopVisit).filter(
        models.ShopVisit.salesman_id == current_user.id
    ).order_by(models.ShopVisit.visit_date.desc()).limit(limit).all()
    
    result = []
    for v in visits:
        result.append({
            "id": v.id,
            "salesman_id": v.salesman_id,
            "customer_name": v.customer_name or "N/A",
            "shop_name": v.shop_name or "N/A",
            "shop_address": v.shop_address,
            "customer_contact": v.customer_contact,
            "location": v.location,
            "requirements": v.requirements,
            "requirement_details": v.requirement_details,
            "product_interest": v.product_interest,
            "expected_closing": v.expected_closing.isoformat() if v.expected_closing else None,
            "follow_up_date": v.follow_up_date.isoformat() if v.follow_up_date else None,
            "follow_up_required": v.follow_up_required,
            "visit_type": v.visit_type or "New",
            "notes": v.notes,
            "visit_date": v.visit_date.isoformat() if v.visit_date else None,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "gps_lat": v.gps_lat,
            "gps_lng": v.gps_lng,
            "photo_url": v.photo_url,
            "voice_note_text": v.voice_note_text,
            "enquiry_id": v.enquiry_id,
        })
    return result

@router.post("/attendance")
async def mark_attendance(
    time: str = Form(...),
    location: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    status: str = Form("Present"),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mark attendance with photo upload"""
    
    # Upload photo to S3
    s3_url = s3_upload(photo, "attendance")
    file_path = s3_url
    
    # Create attendance record
    attendance_data = schemas.AttendanceCreate(
        time=time,
        location=location,
        latitude=latitude,
        longitude=longitude,
        status=status,
        photo_path=str(file_path)
    )
    
    return crud.create_attendance(db=db, attendance=attendance_data, employee_id=current_user.id)

@router.get("/my-attendance")
def get_my_attendance(
    today_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get attendance records for current user"""
    date = None
    if today_only:
        date = datetime.utcnow()
    
    return crud.get_attendance_by_employee(db, employee_id=current_user.id, date=date)

# ENHANCED SALESMAN FEATURES

@router.get("/salesman/analytics/summary", response_model=schemas.SalesmanAnalytics)
def get_salesman_analytics_summary(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get analytics summary for salesman (SALESMAN or ADMIN viewing)"""
    # Allow admin to view any salesman's analytics by passing user_id
    if current_user.role == models.UserRole.ADMIN and user_id:
        target_user_id = user_id
    elif current_user.role == models.UserRole.SALESMAN:
        target_user_id = current_user.id
    else:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    # Assigned enquiries
    assigned_enquiries = db.query(models.Enquiry).filter(
        models.Enquiry.assigned_to == target_user_id
    ).count()
    
    # Pending followups (today or overdue)
    pending_followups = db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.salesman_id == target_user_id,
        models.SalesFollowUp.status == "Pending",
        models.SalesFollowUp.followup_date <= datetime.utcnow() + timedelta(days=1)
    ).count()
    
    # Converted enquiries
    converted_enquiries = db.query(models.Enquiry).filter(
        models.Enquiry.assigned_to == current_user.id,
        models.Enquiry.status == "CONVERTED"
    ).count()
    
    # Revenue this month (from approved orders)
    today = date.today()
    first_day = today.replace(day=1)
    
    revenue_this_month = db.query(func.sum(models.Order.total_amount)).join(
        models.Enquiry, models.Order.enquiry_id == models.Enquiry.id
    ).filter(
        models.Enquiry.assigned_to == current_user.id,
        models.Order.status == "APPROVED",
        models.Order.created_at >= first_day
    ).scalar() or 0
    
    # Missed followups
    missed_followups = db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.salesman_id == current_user.id,
        models.SalesFollowUp.status == "Pending",
        models.SalesFollowUp.followup_date < datetime.utcnow()
    ).count()
    
    # Orders pending approval
    orders_pending = db.query(models.Order).filter(
        models.Order.salesman_id == current_user.id,
        models.Order.status == "PENDING"
    ).count()
    
    # Conversion rate
    conversion_rate = (converted_enquiries / assigned_enquiries * 100) if assigned_enquiries > 0 else 0
    
    # Average closing days
    converted = db.query(models.Enquiry).filter(
        models.Enquiry.assigned_to == current_user.id,
        models.Enquiry.status == "CONVERTED"
    ).all()
    
    avg_closing_days = 0
    if converted:
        total_days = sum([(e.last_follow_up or e.created_at) - e.created_at for e in converted], timedelta()).days
        avg_closing_days = total_days / len(converted) if len(converted) > 0 else 0
    
    return {
        "assigned_enquiries": assigned_enquiries,
        "pending_followups": pending_followups,
        "converted_enquiries": converted_enquiries,
        "revenue_this_month": revenue_this_month,
        "missed_followups": missed_followups,
        "orders_pending_approval": orders_pending,
        "conversion_rate": round(conversion_rate, 2),
        "avg_closing_days": round(avg_closing_days, 2)
    }

@router.get("/salesman/enquiries")
def get_salesman_enquiries(
    status: str = None,
    priority: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Get enquiries assigned to current salesman - Attendance required"""
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    query = db.query(models.Enquiry).filter(models.Enquiry.assigned_to == current_user.id)
    
    if status:
        query = query.filter(models.Enquiry.status == status)
    if priority:
        query = query.filter(models.Enquiry.priority == priority)
    
    return query.order_by(models.Enquiry.created_at.desc()).all()

@router.put("/salesman/enquiries/{enquiry_id}")
def update_salesman_enquiry(
    enquiry_id: int,
    enquiry_update: schemas.EnquiryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Update enquiry - Salesman can update their own enquiries - Attendance required"""
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can update enquiries")
    
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    if enquiry.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own enquiries")
    
    # Update allowed fields
    if enquiry_update.status is not None:
        enquiry.status = enquiry_update.status
        if enquiry_update.status in ["CONVERTED", "LOST"]:
            enquiry.last_follow_up = datetime.utcnow()
    
    if enquiry_update.priority is not None:
        enquiry.priority = enquiry_update.priority
    
    if enquiry_update.next_follow_up is not None:
        enquiry.next_follow_up = enquiry_update.next_follow_up
    
    if enquiry_update.notes is not None:
        enquiry.notes = enquiry_update.notes
    
    db.commit()
    db.refresh(enquiry)
    
    return enquiry

@router.get("/salesman/followups/today")
def get_today_followups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Get today's followups for current salesman - Attendance required"""
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0)
    today_end = today_start + timedelta(days=1)
    
    return db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.salesman_id == current_user.id,
        models.SalesFollowUp.status == "Pending",
        models.SalesFollowUp.followup_date >= today_start,
        models.SalesFollowUp.followup_date < today_end
    ).all()


# ==========================================
# FOLLOW-UP COMPLETION ENDPOINT
# ==========================================

@router.patch("/followups/{followup_id}/complete")
def complete_followup(
    followup_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mark a follow-up as completed. Updates DB with completed_at timestamp."""
    followup = db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.id == followup_id
    ).first()
    
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    # Salesman can only complete their own follow-ups
    if current_user.role == models.UserRole.SALESMAN and followup.salesman_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only complete your own follow-ups")
    
    if followup.status == "Completed":
        raise HTTPException(status_code=400, detail="Follow-up is already completed")
    
    followup.status = "Completed"
    followup.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(followup)
    
    return {
        "id": followup.id,
        "status": followup.status,
        "completed_at": followup.completed_at.isoformat() if followup.completed_at else None,
        "message": "Follow-up marked as completed"
    }


@router.patch("/followups/{followup_id}/reschedule")
def reschedule_followup(
    followup_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Reschedule a follow-up to a new date."""
    followup = db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.id == followup_id
    ).first()
    
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    if current_user.role == models.UserRole.SALESMAN and followup.salesman_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only reschedule your own follow-ups")
    
    if followup.status == "Completed":
        raise HTTPException(status_code=400, detail="Cannot reschedule a completed follow-up")
    
    new_date = body.get("new_date")
    if not new_date:
        raise HTTPException(status_code=400, detail="new_date is required")
    
    try:
        followup.followup_date = datetime.fromisoformat(new_date)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
    
    followup.status = "Pending"
    
    if body.get("note"):
        followup.note = body["note"]
    
    db.commit()
    db.refresh(followup)
    
    return {
        "id": followup.id,
        "status": followup.status,
        "followup_date": followup.followup_date.isoformat(),
        "message": "Follow-up rescheduled successfully"
    }


# ==========================================
# DAILY REPORT ENDPOINTS (ENHANCED)
# ==========================================

@router.get("/salesman/daily-report/today", response_model=schemas.DailyReportPrefill)
def get_daily_report_prefill(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    GET prefill data for daily report screen.
    Returns:
    - Attendance status (gate check)
    - Auto-derived metrics (calls, meetings, orders)
    - Whether report is already submitted
    """
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = today_start + timedelta(days=1)
    
    # Check attendance (MANDATORY GATE)
    attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.id,
        func.date(models.Attendance.date) == today
    ).first()
    
    attendance_marked = attendance is not None
    attendance_id = attendance.id if attendance else None
    
    # Check if report already submitted
    existing_report = db.query(models.DailyReport).filter(
        models.DailyReport.salesman_id == current_user.id,
        models.DailyReport.report_date == today
    ).first()
    
    already_submitted = existing_report is not None and existing_report.report_submitted
    
    # AUTO-DERIVE METRICS from backend data (NOT manual input)
    
    # 1. Calls Made - from SalesCall table (uses call_date)
    calls_made = db.query(models.SalesCall).filter(
        models.SalesCall.salesman_id == current_user.id,
        models.SalesCall.call_date >= today_start,
        models.SalesCall.call_date < today_end
    ).count()
    
    # 2. Meetings/Visits Done - from ShopVisit table
    meetings_done = db.query(models.ShopVisit).filter(
        models.ShopVisit.salesman_id == current_user.id,
        models.ShopVisit.created_at >= today_start,
        models.ShopVisit.created_at < today_end
    ).count()
    
    # 3. Orders Closed - from Order table (created today)
    orders_closed = db.query(models.Order).filter(
        models.Order.salesman_id == current_user.id,
        models.Order.created_at >= today_start,
        models.Order.created_at < today_end
    ).count()
    
    return schemas.DailyReportPrefill(
        date=today,
        attendance_marked=attendance_marked,
        attendance_id=attendance_id,
        already_submitted=already_submitted,
        existing_report_id=existing_report.id if existing_report else None,
        calls_made=calls_made,
        meetings_done=meetings_done,
        orders_closed=orders_closed,
        manual_calls=existing_report.manual_calls if existing_report and existing_report.manual_calls else 0,
        manual_meetings=existing_report.manual_meetings if existing_report and existing_report.manual_meetings else 0,
        manual_orders=existing_report.manual_orders if existing_report and existing_report.manual_orders else 0,
        achievements=existing_report.achievements if existing_report else None,
        challenges=existing_report.challenges if existing_report else None,
        tomorrow_plan=existing_report.tomorrow_plan if existing_report else None,
        submission_time=existing_report.submission_time if existing_report else None
    )


@router.get("/salesman/daily-report")
def get_today_daily_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get today's daily report for current salesman (legacy endpoint)"""
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    today = date.today()
    
    report = db.query(models.DailyReport).filter(
        models.DailyReport.salesman_id == current_user.id,
        models.DailyReport.report_date == today
    ).first()
    
    # Return null if no report exists for today (better UX)
    return report


@router.post("/salesman/daily-report", response_model=schemas.DailyReport)
def submit_daily_report(
    report: schemas.DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """
    Submit daily report - Salesman only
    
    RULES (LOCKED):
    1. Attendance MUST be marked for today
    2. ONE report per day (no duplicates)
    3. Report is IMMUTABLE after submission (no edit/delete)
    4. Metrics are AUTO-DERIVED (not from frontend)
    5. Only manual fields: achievements, challenges, tomorrow_plan
    """
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can submit daily reports")
    
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = today_start + timedelta(days=1)
    
    # GATE 1: Check attendance is marked for TODAY
    attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.id,
        func.date(models.Attendance.date) == today
    ).first()
    
    if not attendance:
        raise HTTPException(
            status_code=400, 
            detail="You must mark attendance before submitting daily report"
        )
    
    # GATE 2: Check for duplicate report (IMMUTABLE - no overwrites)
    existing_report = db.query(models.DailyReport).filter(
        models.DailyReport.salesman_id == current_user.id,
        models.DailyReport.report_date == today
    ).first()
    
    if existing_report and existing_report.report_submitted:
        raise HTTPException(
            status_code=400, 
            detail="Daily report already submitted for today. Reports cannot be edited."
        )
    
    # GATE 3: Validate required fields
    if not report.achievements or not report.achievements.strip():
        raise HTTPException(status_code=400, detail="Achievements field is required")
    
    if not report.challenges or not report.challenges.strip():
        raise HTTPException(status_code=400, detail="Challenges field is required")
    
    if not report.tomorrow_plan or not report.tomorrow_plan.strip():
        raise HTTPException(status_code=400, detail="Tomorrow's plan is required")
    
    # AUTO-DERIVE METRICS (backend calculated - not from frontend)
    calls_made = db.query(models.SalesCall).filter(
        models.SalesCall.salesman_id == current_user.id,
        models.SalesCall.call_date >= today_start,
        models.SalesCall.call_date < today_end
    ).count()
    
    meetings_done = db.query(models.ShopVisit).filter(
        models.ShopVisit.salesman_id == current_user.id,
        models.ShopVisit.created_at >= today_start,
        models.ShopVisit.created_at < today_end
    ).count()
    
    orders_closed = db.query(models.Order).filter(
        models.Order.salesman_id == current_user.id,
        models.Order.created_at >= today_start,
        models.Order.created_at < today_end
    ).count()
    
    enquiries_generated = db.query(models.Enquiry).filter(
        models.Enquiry.assigned_to == current_user.id,
        models.Enquiry.created_at >= today_start,
        models.Enquiry.created_at < today_end
    ).count()
    
    # Create report with auto-derived metrics + manual fields
    db_report = models.DailyReport(
        salesman_id=current_user.id,
        report_date=today,
        
        # Auto-derived (backend calculated)
        calls_made=calls_made,
        shops_visited=meetings_done,
        enquiries_generated=enquiries_generated,
        sales_closed=orders_closed,
        
        # Manual input (from salesman)
        achievements=report.achievements.strip(),
        challenges=report.challenges.strip(),
        tomorrow_plan=report.tomorrow_plan.strip(),
        report_notes=report.report_notes.strip() if report.report_notes else None,
        
        # Metadata
        report_submitted=True,
        submission_time=datetime.utcnow(),
        attendance_id=attendance.id
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report


@router.patch("/salesman/daily-report/{report_date}")
def update_daily_report(
    report_date: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update daily report - allows editing manual metric adjustments.
    Salesman can add manual_calls, manual_meetings, manual_orders to supplement auto-derived counts.
    Also allows editing achievements, challenges, tomorrow_plan after submission.
    """
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    try:
        date_obj = datetime.fromisoformat(report_date).date()
    except (ValueError, TypeError):
        date_obj = date.today()
    
    report = db.query(models.DailyReport).filter(
        models.DailyReport.salesman_id == current_user.id,
        models.DailyReport.report_date == date_obj
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="No report found for this date")
    
    # Allow updating manual metric adjustments
    if "manual_calls" in body:
        report.manual_calls = int(body["manual_calls"])
    if "manual_meetings" in body:
        report.manual_meetings = int(body["manual_meetings"])
    if "manual_orders" in body:
        report.manual_orders = int(body["manual_orders"])
    
    # Allow updating text fields even after submission
    if "achievements" in body and body["achievements"]:
        report.achievements = body["achievements"].strip()
    if "challenges" in body and body["challenges"]:
        report.challenges = body["challenges"].strip()
    if "tomorrow_plan" in body and body["tomorrow_plan"]:
        report.tomorrow_plan = body["tomorrow_plan"].strip()
    
    db.commit()
    db.refresh(report)
    
    return {
        "id": report.id,
        "calls_made": report.calls_made,
        "manual_calls": report.manual_calls or 0,
        "shops_visited": report.shops_visited,
        "manual_meetings": report.manual_meetings or 0,
        "sales_closed": report.sales_closed,
        "manual_orders": report.manual_orders or 0,
        "message": "Report updated successfully"
    }


@router.get("/salesman/daily-report/{report_date}")
def get_daily_report(
    report_date: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get daily report for specific date"""
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    date_obj = datetime.fromisoformat(report_date).date()
    
    report = db.query(models.DailyReport).filter(
        models.DailyReport.salesman_id == current_user.id,
        models.DailyReport.report_date == date_obj
    ).first()
    
    if not report:
        # Return null instead of 404 for better UX
        return None
    
    return report

@router.get("/salesman/funnel", response_model=schemas.SalesFunnelData)
def get_salesman_funnel(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get sales funnel for current salesman"""
    
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can access this")
    
    query = db.query(models.Enquiry).filter(models.Enquiry.assigned_to == current_user.id)
    
    return {
        "new": query.filter(models.Enquiry.status == "NEW").count(),
        "contacted": query.filter(models.Enquiry.status == "CONTACTED").count(),
        "followup": query.filter(models.Enquiry.status == "FOLLOW_UP").count(),
        "quoted": query.filter(models.Enquiry.status == "QUOTED").count(),
        "converted": query.filter(models.Enquiry.status == "CONVERTED").count(),
        "lost": query.filter(models.Enquiry.status == "LOST").count()
    }

