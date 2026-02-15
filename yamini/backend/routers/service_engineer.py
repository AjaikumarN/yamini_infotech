"""
Service Engineer Module - PRODUCTION SAFE
Role: View assigned jobs, update status, submit daily reports, track SLA
RBAC: Strict enforcement - no access to enquiries, MIF, stock, invoices, or sales data
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, date, timedelta
import logging
import schemas
import models
import auth
from database import get_db
from notification_service import NotificationService
from services.whatsapp_service import WhatsAppMessageTemplates
from services.communication_queue import queue_customer_whatsapp, notify_roles

router = APIRouter(prefix="/api/service-engineer", tags=["Service Engineer"])

# ============================================================================
# GLOBAL DEPENDENCIES - RBAC + ATTENDANCE ENFORCEMENT
# ============================================================================

async def require_service_engineer_role(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Enforce Service Engineer role"""
    if current_user.role != models.UserRole.SERVICE_ENGINEER:
        raise HTTPException(
            status_code=403,
            detail="Access denied. This endpoint is for Service Engineers only."
        )
    return current_user

async def require_service_engineer_attendance(
    current_user: models.User = Depends(require_service_engineer_role),
    db: Session = Depends(get_db)
):
    """Enforce attendance check for service engineers"""
    today = date.today()
    
    print(f"DEBUG Attendance Check: User {current_user.id}, Date {today}")
    
    attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.id,
        models.Attendance.attendance_date == today
    ).first()
    
    if attendance:
        print(f"DEBUG: Found attendance - Date: {attendance.attendance_date}, Status: {attendance.status}")
    else:
        print(f"DEBUG: No attendance found for today")
    
    if not attendance:
        raise HTTPException(
            status_code=403,
            detail="Please mark your attendance before accessing service jobs"
        )
    
    return current_user

# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

@router.get("/dashboard")
async def get_service_engineer_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Get Service Engineer dashboard with KPIs and assigned jobs"""
    
    # Get all assigned jobs
    all_jobs = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == current_user.id
    ).all()
    
    today = datetime.utcnow().date()
    
    # Calculate KPIs
    assigned_jobs = [j for j in all_jobs if j.status != "COMPLETED"]
    completed_today = [
        j for j in all_jobs 
        if j.status == "COMPLETED" and j.completed_at and j.completed_at.date() == today
    ]
    pending_jobs = [j for j in assigned_jobs if j.status in ["ASSIGNED", "ON_THE_WAY"]]
    
    # Calculate SLA risks
    sla_at_risk = []
    for job in assigned_jobs:
        if job.sla_time:
            remaining = (job.sla_time - datetime.utcnow()).total_seconds()
            if remaining <= 3600:  # Less than 1 hour
                sla_at_risk.append(job)
    
    return {
        "kpis": {
            "assigned_jobs": len(assigned_jobs),
            "sla_at_risk": len(sla_at_risk),
            "completed_today": len(completed_today),
            "pending": len(pending_jobs)
        },
        "jobs": [
            {
                "id": job.id,
                "ticket_no": job.ticket_no,
                "customer_name": job.customer_name,
                "machine_model": job.machine_model,
                "fault_description": job.fault_description,
                "priority": job.priority,
                "status": job.status,
                "sla_time": job.sla_time,
                "sla_remaining_seconds": int((job.sla_time - datetime.utcnow()).total_seconds()) if job.sla_time else 0,
                "created_at": job.created_at,
            }
            for job in assigned_jobs
        ]
    }

# ============================================================================
# ASSIGNED SERVICE JOBS
# ============================================================================

@router.get("/jobs")
async def get_assigned_jobs(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Get all jobs assigned to current service engineer"""
    
    query = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == current_user.id
    )
    
    if status:
        query = query.filter(models.Complaint.status == status)
    
    jobs = query.order_by(models.Complaint.sla_time.asc()).all()
    
    result = []
    for job in jobs:
        sla_remaining = 0
        sla_status = "ok"
        
        if job.sla_time and job.status != "COMPLETED":
            remaining_seconds = (job.sla_time - datetime.utcnow()).total_seconds()
            sla_remaining = int(remaining_seconds)
            
            if remaining_seconds <= 0:
                sla_status = "breached"
            elif remaining_seconds <= 3600:  # 1 hour warning
                sla_status = "warning"
        
        result.append({
            "id": job.id,
            "ticket_no": job.ticket_no,
            "customer_name": job.customer_name,
            "phone": job.phone,
            "address": job.address,
            "machine_model": job.machine_model,
            "fault_description": job.fault_description,
            "priority": job.priority,
            "status": job.status,
            "sla_time": job.sla_time,
            "sla_remaining_seconds": sla_remaining,
            "sla_status": sla_status,
            "created_at": job.created_at,
            "completed_at": job.completed_at,
            "resolution_notes": job.resolution_notes,
            "parts_replaced": job.parts_replaced,
        })
    
    return result

@router.get("/jobs/{job_id}")
async def get_job_details(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Get specific job details - only if assigned to current engineer"""
    
    job = db.query(models.Complaint).filter(
        models.Complaint.id == job_id,
        models.Complaint.assigned_to == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found or not assigned to you"
        )
    
    sla_remaining = 0
    sla_status = "ok"
    
    if job.sla_time and job.status != "COMPLETED":
        remaining_seconds = (job.sla_time - datetime.utcnow()).total_seconds()
        sla_remaining = int(remaining_seconds)
        
        if remaining_seconds <= 0:
            sla_status = "breached"
        elif remaining_seconds <= 3600:
            sla_status = "warning"
    
    return {
        "id": job.id,
        "ticket_no": job.ticket_no,
        "customer_name": job.customer_name,
        "phone": job.phone,
        "address": job.address,
        "machine_model": job.machine_model,
        "fault_description": job.fault_description,
        "priority": job.priority,
        "status": job.status,
        "sla_time": job.sla_time,
        "sla_remaining_seconds": sla_remaining,
        "sla_status": sla_status,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
        "resolution_notes": job.resolution_notes,
        "parts_replaced": job.parts_replaced,
        "feedback_url": job.feedback_url,
        "feedback_qr": job.feedback_qr,
    }

# ============================================================================
# JOB STATUS UPDATES
# ============================================================================

@router.put("/jobs/{job_id}/status")
async def update_job_status(
    job_id: int,
    update: schemas.ComplaintUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Update job status - only for assigned jobs"""
    
    job = db.query(models.Complaint).filter(
        models.Complaint.id == job_id,
        models.Complaint.assigned_to == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found or not assigned to you"
        )
    
    if job.status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail="Cannot update completed job"
        )
    
    # Validate status transitions
    valid_transitions = {
        "ASSIGNED": ["ON_THE_WAY", "ON_HOLD"],
        "ON_THE_WAY": ["IN_PROGRESS", "ON_HOLD"],
        "IN_PROGRESS": ["ON_HOLD"],  # Completion is separate endpoint
        "ON_HOLD": ["ASSIGNED", "ON_THE_WAY", "IN_PROGRESS"]
    }
    
    if update.status and update.status not in valid_transitions.get(job.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {job.status} to {update.status}"
        )
    
    # Update fields
    if update.status:
        job.status = update.status
    if update.resolution_notes:
        job.resolution_notes = update.resolution_notes
    if update.parts_replaced:
        job.parts_replaced = update.parts_replaced
    
    db.commit()
    db.refresh(job)
    
    # Notify admin/reception of status change
    background_tasks.add_task(
        NotificationService.notify_service_updated,
        db, job, current_user.full_name
    )
    
    return {"message": "Job status updated successfully", "job": job}

# ============================================================================
# JOB COMPLETION & FEEDBACK
# ============================================================================

@router.post("/jobs/{job_id}/complete")
async def complete_job(
    job_id: int,
    completion_data: schemas.ServiceCompleteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Complete job and generate feedback QR/link"""
    
    job = db.query(models.Complaint).filter(
        models.Complaint.id == job_id,
        models.Complaint.assigned_to == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found or not assigned to you"
        )
    
    if job.status == "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail="Job already completed"
        )
    
    if not completion_data.resolution_notes or len(completion_data.resolution_notes.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Resolution notes are mandatory"
        )
    
    # Mark as completed
    job.status = "COMPLETED"
    job.completed_at = datetime.utcnow()
    job.resolution_notes = completion_data.resolution_notes
    job.parts_replaced = completion_data.parts_replaced
    
    # Generate feedback URL and QR
    import os
    import qrcode
    from io import BytesIO
    import base64
    
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    feedback_url = f"{FRONTEND_URL}/feedback/{job.id}"
    
    qr = qrcode.make(feedback_url)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    feedback_qr = base64.b64encode(buffer.getvalue()).decode()
    
    job.feedback_url = feedback_url
    job.feedback_qr = feedback_qr
    
    db.commit()
    db.refresh(job)
    
    # Notify admin and reception
    background_tasks.add_task(
        NotificationService.notify_service_completed,
        db, job, current_user.full_name
    )
    
    # Queue WhatsApp notification to customer (worker sends it)
    try:
        if getattr(job, 'phone', None):
            from datetime import datetime as _dt
            completed_date = _dt.utcnow().strftime("%d/%m/%Y")
            if hasattr(job, 'completed_at') and job.completed_at:
                completed_date = job.completed_at.strftime("%d/%m/%Y")
            msg = WhatsAppMessageTemplates.service_completed(
                customer_name=job.customer_name or "Customer",
                ticket_id=job.ticket_no or f"SRV-{job.id}",
                completed_date=completed_date,
                feedback_link=feedback_url,
            )
            queue_customer_whatsapp(
                db=db, event_type="SERVICE_COMPLETED",
                phone=job.phone, message=msg,
                reference_table="complaints", reference_id=job.id,
                customer_name=job.customer_name,
            )
    except Exception as e:
        logging.error(f"Failed to queue WhatsApp for service completion: {e}")

    # Staff notification → Admin + Reception
    try:
        notify_roles(
            db=db, roles=["ADMIN", "RECEPTION"],
            title="Job Completed",
            message=f"Ticket {job.ticket_no or job.id} completed by {current_user.full_name}",
            module="complaints", entity_type="complaint", entity_id=job.id,
            priority="NORMAL", action_url="/service",
        )
    except Exception:
        pass

    return {
        "message": "Job completed successfully",
        "feedback_url": feedback_url,
        "feedback_qr": feedback_qr,
        "job": job
    }

# ============================================================================
# SERVICE HISTORY
# ============================================================================

@router.get("/history")
async def get_service_history(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Get service history for current engineer"""
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    jobs = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == current_user.id,
        models.Complaint.status == "COMPLETED",
        models.Complaint.completed_at >= cutoff_date
    ).order_by(models.Complaint.completed_at.desc()).all()
    
    return [
        {
            "id": job.id,
            "ticket_no": job.ticket_no,
            "customer_name": job.customer_name,
            "machine_model": job.machine_model,
            "priority": job.priority,
            "completed_at": job.completed_at,
            "resolution_notes": job.resolution_notes,
            "parts_replaced": job.parts_replaced,
        }
        for job in jobs
    ]

# ============================================================================
# FEEDBACK TRACKING
# ============================================================================

@router.get("/feedback")
async def get_my_feedback(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Get feedback for jobs completed by current engineer"""
    
    # Get all completed jobs by this engineer
    job_ids = db.query(models.Complaint.id).filter(
        models.Complaint.assigned_to == current_user.id,
        models.Complaint.status == "COMPLETED"
    ).all()
    
    job_ids = [j[0] for j in job_ids]
    
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.service_request_id.in_(job_ids)
    ).order_by(models.Feedback.created_at.desc()).all()
    
    # Join with job details
    result = []
    for feedback in feedbacks:
        job = db.query(models.Complaint).filter(
            models.Complaint.id == feedback.service_request_id
        ).first()
        
        result.append({
            "id": feedback.id,
            "ticket_no": job.ticket_no if job else None,
            "customer_name": feedback.customer_name,
            "rating": feedback.rating,
            "comment": feedback.comment,
            "is_negative": feedback.is_negative,
            "created_at": feedback.created_at,
        })
    
    return result

# ============================================================================
# DAILY REPORTS
# ============================================================================

@router.post("/daily-report")
async def submit_daily_report(
    report: schemas.ServiceEngineerDailyReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Submit end-of-day report - one per day"""
    
    today = date.today()
    
    # Check if report already exists for today
    existing = db.query(models.ServiceEngineerDailyReport).filter(
        models.ServiceEngineerDailyReport.engineer_id == current_user.id,
        models.ServiceEngineerDailyReport.report_date == today
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Daily report already submitted for today"
        )
    
    # Create report
    db_report = models.ServiceEngineerDailyReport(
        engineer_id=current_user.id,
        report_date=today,
        jobs_completed=report.jobs_completed,
        jobs_pending=report.jobs_pending,
        issues_faced=report.issues_faced,
        remarks=report.remarks,
        submitted_at=datetime.utcnow()
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return {"message": "Daily report submitted successfully", "report": db_report}

@router.get("/daily-report/status")
async def check_daily_report_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Check if engineer has submitted daily report today"""
    
    today = date.today()
    
    report = db.query(models.ServiceEngineerDailyReport).filter(
        models.ServiceEngineerDailyReport.engineer_id == current_user.id,
        models.ServiceEngineerDailyReport.report_date == today
    ).first()
    
    return {
        "submitted_today": report is not None,
        "report_date": today.isoformat() if report else None
    }

@router.get("/daily-report")
async def get_my_daily_reports(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Get daily reports for current engineer"""
    
    cutoff_date = date.today() - timedelta(days=days)
    
    reports = db.query(models.ServiceEngineerDailyReport).filter(
        models.ServiceEngineerDailyReport.engineer_id == current_user.id,
        models.ServiceEngineerDailyReport.report_date >= cutoff_date
    ).order_by(models.ServiceEngineerDailyReport.report_date.desc()).all()
    
    return reports

# ============================================================================
# SLA TRACKER
# ============================================================================

@router.get("/sla-tracker")
async def get_sla_tracker(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_service_engineer_attendance)
):
    """Get SLA status for all assigned jobs"""
    
    jobs = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == current_user.id,
        models.Complaint.status != "COMPLETED"
    ).order_by(models.Complaint.sla_time.asc()).all()
    
    result = []
    for job in jobs:
        if job.sla_time:
            remaining_seconds = (job.sla_time - datetime.utcnow()).total_seconds()
            
            if remaining_seconds <= 0:
                risk = "🔴 BREACHED"
            elif remaining_seconds <= 3600:
                risk = "🟡 WARNING"
            else:
                risk = "🟢 OK"
            
            result.append({
                "ticket_no": job.ticket_no,
                "customer_name": job.customer_name,
                "priority": job.priority,
                "sla_due": job.sla_time,
                "remaining_seconds": int(remaining_seconds),
                "remaining_formatted": format_time(int(remaining_seconds)),
                "risk": risk,
            })
    
    return result

def format_time(seconds: int) -> str:
    """Format seconds into human-readable time"""
    if seconds <= 0:
        return "OVERDUE"
    
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    
    if hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m"

# ============================================================================
# RBAC ENFORCEMENT - BLOCKED ENDPOINTS
# ============================================================================

@router.get("/enquiries")
async def blocked_enquiries(current_user: models.User = Depends(require_service_engineer_role)):
    """Service Engineers cannot access enquiries"""
    raise HTTPException(status_code=403, detail="Access denied: Service Engineers cannot view enquiries")

@router.get("/mif")
async def blocked_mif(current_user: models.User = Depends(require_service_engineer_role)):
    """Service Engineers cannot access MIF"""
    raise HTTPException(status_code=403, detail="Access denied: Service Engineers cannot view MIF")

@router.post("/stock")
async def blocked_stock(current_user: models.User = Depends(require_service_engineer_role)):
    """Service Engineers cannot update stock"""
    raise HTTPException(status_code=403, detail="Access denied: Service Engineers cannot update stock")

@router.post("/orders")
async def blocked_orders(current_user: models.User = Depends(require_service_engineer_role)):
    """Service Engineers cannot create orders"""
    raise HTTPException(status_code=403, detail="Access denied: Service Engineers cannot create orders")

@router.get("/sales")
async def blocked_sales(current_user: models.User = Depends(require_service_engineer_role)):
    """Service Engineers cannot view sales data"""
    raise HTTPException(status_code=403, detail="Access denied: Service Engineers cannot view sales data")
