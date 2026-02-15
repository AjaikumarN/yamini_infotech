from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta
import qrcode
from io import BytesIO
import base64
import uuid
import os
import logging
import schemas
import models
import auth
from database import get_db
from notification_service import NotificationService
from services.whatsapp_service import WhatsAppMessageTemplates
from services.communication_queue import queue_customer_whatsapp, queue_staff_notification

router = APIRouter(prefix="/api/service-requests", tags=["Service Requests"])

# Get frontend URL from environment variable
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# SLA Configuration (hours)
SLA_RULES = {
    "NORMAL": 24,
    "URGENT": 6,
    "CRITICAL": 2
}

def calculate_sla_time(priority: str, created_at: datetime) -> datetime:
    """Calculate SLA due time based on priority"""
    hours = SLA_RULES.get(priority, 24)
    return created_at + timedelta(hours=hours)

def generate_feedback_qr(feedback_url: str) -> str:
    """Generate QR code for feedback URL"""
    try:
        qr = qrcode.make(feedback_url)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")
        buffer.seek(0)  # Reset buffer position to beginning
        encoded = base64.b64encode(buffer.getvalue()).decode()
        return encoded
    except Exception as e:
        print(f"Error generating QR code: {e}")
        raise

def check_sla_status(service: models.Complaint) -> dict:
    """Check SLA status and calculate remaining time"""
    if service.status == "COMPLETED" or not service.sla_time:
        return {"status": "ok", "remaining_seconds": 0}
    
    now = datetime.utcnow()
    
    # Handle ON_HOLD status - SLA paused
    if service.status == "ON_HOLD":
        remaining = (service.sla_time - now).total_seconds()
        return {
            "status": "paused",
            "remaining_seconds": int(remaining) if remaining > 0 else 0
        }
    
    # Calculate remaining time
    remaining = (service.sla_time - now).total_seconds()
    
    if remaining <= 0:
        return {"status": "breached", "remaining_seconds": 0}
    elif remaining <= 3600:  # Warning at 1 hour
        return {"status": "warning", "remaining_seconds": int(remaining)}
    else:
        return {"status": "ok", "remaining_seconds": int(remaining)}

@router.post("/public", response_model=schemas.Complaint)
async def create_public_service_request(
    complaint: schemas.ComplaintCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create service request from customer (PUBLIC - no auth required)"""
    # Generate ticket number
    ticket_no = f"SR{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"
    
    created_at = datetime.utcnow()
    # Default to NORMAL priority for public requests
    priority = complaint.priority if complaint.priority else "NORMAL"
    sla_time = calculate_sla_time(priority, created_at)
    
    db_complaint = models.Complaint(
        ticket_no=ticket_no,
        customer_id=None,  # Public customers don't have accounts
        customer_name=complaint.customer_name,
        phone=complaint.phone,
        email=complaint.email,
        company=complaint.company,
        address=complaint.address,
        machine_model=complaint.machine_model,
        fault_description=complaint.fault_description,
        priority=priority,
        status="NEW",  # Start as NEW instead of ASSIGNED
        assigned_to=None,  # Reception will assign
        sla_time=sla_time,
        created_at=created_at
    )
    
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    
    # Notify reception about new request
    # background_tasks.add_task(
    #     NotificationService.notify_new_service_request,
    #     db, db_complaint
    # )
    
    return db_complaint

@router.post("/", response_model=schemas.Complaint)
async def create_service_request(
    complaint: schemas.ComplaintCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new service request (Admin/Reception only)"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Only Admin and Reception can create service requests")
    
    # Generate ticket number
    ticket_no = f"SR{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}"
    
    created_at = datetime.utcnow()
    sla_time = calculate_sla_time(complaint.priority, created_at)
    
    db_complaint = models.Complaint(
        ticket_no=ticket_no,
        customer_id=complaint.customer_id,
        customer_name=complaint.customer_name,
        phone=complaint.phone,
        email=complaint.email,
        company=complaint.company,
        address=complaint.address,
        machine_model=complaint.machine_model,
        fault_description=complaint.fault_description,
        priority=complaint.priority,
        status="ASSIGNED",
        assigned_to=complaint.assigned_to,
        sla_time=sla_time,
        created_at=created_at
    )
    
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    
    # Send notifications
    if complaint.assigned_to:
        background_tasks.add_task(
            NotificationService.notify_service_assigned,
            db, db_complaint, complaint.assigned_to
        )
    
    return db_complaint

@router.put("/{service_id}/assign", response_model=schemas.Complaint)
async def assign_engineer_to_service(
    service_id: int,
    engineer_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Assign or reassign engineer to service request (Admin/Reception only)"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Only Admin and Reception can assign engineers")
    
    service = db.query(models.Complaint).filter(models.Complaint.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Verify engineer exists and has correct role
    engineer = db.query(models.User).filter(
        models.User.id == engineer_id,
        models.User.role == models.UserRole.SERVICE_ENGINEER
    ).first()
    
    if not engineer:
        raise HTTPException(status_code=404, detail="Service engineer not found")
    
    # Update assignment
    service.assigned_to = engineer_id
    if service.status == "PENDING":
        service.status = "ASSIGNED"
    
    db.commit()
    db.refresh(service)
    
    # Send notification to engineer
    background_tasks.add_task(
        NotificationService.notify_service_assigned,
        db, service, engineer_id
    )
    
    # Queue WhatsApp notification to customer (worker sends it)
    try:
        if getattr(service, 'phone', None):
            msg = WhatsAppMessageTemplates.engineer_assigned(
                customer_name=service.customer_name or "Customer",
                ticket_id=service.ticket_no or f"SRV-{service.id}",
                engineer_name=engineer.full_name or "Our Engineer",
            )
            queue_customer_whatsapp(
                db=db, event_type="ENGINEER_ASSIGNED",
                phone=service.phone, message=msg,
                reference_table="complaints", reference_id=service.id,
                customer_name=service.customer_name,
            )
    except Exception as e:
        logging.error(f"Failed to queue WhatsApp for engineer assignment: {e}")

    # Staff notification → assigned engineer
    try:
        queue_staff_notification(
            db=db, user_id=engineer_id,
            title="New Service Assigned",
            message=f"Ticket {service.ticket_no or service.id} — {service.customer_name or 'Customer'}",
            module="complaints", entity_type="complaint", entity_id=service.id,
            priority="HIGH", action_url="/service-engineer",
        )
    except Exception:
        pass

    return service

@router.get("/my-services")
def get_my_services(
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get service requests assigned to engineer (SERVICE_ENGINEER or ADMIN viewing)"""
    # Allow admin to view any engineer's services by passing user_id
    if current_user.role == models.UserRole.ADMIN and user_id:
        target_user_id = user_id
    elif current_user.role == models.UserRole.SERVICE_ENGINEER:
        target_user_id = current_user.id
    else:
        raise HTTPException(status_code=403, detail="Only service engineers can access this endpoint")
    
    query = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == target_user_id
    )
    
    if status:
        query = query.filter(models.Complaint.status == status)
    
    services = query.order_by(models.Complaint.created_at.desc()).all()
    
    # Convert to list of dictionaries with SLA info
    result = []
    for service in services:
        sla_info = check_sla_status(service)
        
        # Calculate total SLA seconds based on priority
        total_seconds = None
        if service.sla_time and service.created_at:
            total_seconds = int((service.sla_time - service.created_at).total_seconds())
        
        # Get engineer name
        engineer_name = None
        if service.assigned_to:
            engineer = db.query(models.User).filter(models.User.id == service.assigned_to).first()
            if engineer:
                engineer_name = engineer.username
        
        # Convert to dict and add SLA fields
        service_dict = schemas.Complaint.model_validate(service).model_dump()
        service_dict.update({
            "sla_status": {
                "status": sla_info["status"],
                "remaining": sla_info["remaining_seconds"],
                "total_seconds": total_seconds
            },
            "sla_remaining": sla_info["remaining_seconds"],
            "engineer_name": engineer_name
        })
        result.append(service_dict)
    
    return result

@router.get("/public/{service_id}", response_model=schemas.Complaint)
def get_service_for_feedback(
    service_id: int,
    db: Session = Depends(get_db)
):
    """Get service request details for public feedback (No auth required)"""
    service = db.query(models.Complaint).filter(models.Complaint.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    return service

@router.get("/track/{identifier}")
def track_service_request(
    identifier: str,
    db: Session = Depends(get_db)
):
    """Track service request by ticket_no or phone (PUBLIC - no auth required)"""
    # Try to find by ticket_no first
    service = db.query(models.Complaint).filter(models.Complaint.ticket_no == identifier).first()
    
    # If not found and identifier looks like a phone number, search by phone
    if not service and identifier.isdigit() and len(identifier) >= 10:
        service = db.query(models.Complaint).filter(models.Complaint.phone == identifier).order_by(models.Complaint.created_at.desc()).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found. Please check your ticket ID or phone number.")
    
    # Add SLA status and engineer name
    sla_info = check_sla_status(service)
    engineer_name = None
    if service.assigned_to:
        engineer = db.query(models.User).filter(models.User.id == service.assigned_to).first()
        if engineer:
            engineer_name = engineer.username
    
    # Return as dictionary with all fields
    return {
        **schemas.Complaint.model_validate(service).model_dump(),
        "sla_status": sla_info,  # Pass full dict, not just the status string
        "sla_remaining": sla_info["remaining_seconds"],
        "engineer_name": engineer_name
    }

@router.get("/{service_id}", response_model=schemas.Complaint)
def get_service_request(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get specific service request details"""
    service = db.query(models.Complaint).filter(models.Complaint.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # RBAC: Service engineer can only view their assigned services
    if current_user.role == models.UserRole.SERVICE_ENGINEER:
        if service.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view services assigned to you")
    
    # Add SLA status
    sla_info = check_sla_status(service)
    service.sla_status = sla_info  # Pass full dict, not just the status string
    service.sla_remaining = sla_info["remaining_seconds"]
    
    return service

@router.put("/{service_id}/status", response_model=schemas.Complaint)
async def update_service_status(
    service_id: int,
    update: schemas.ComplaintUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update service request status (SERVICE_ENGINEER only)"""
    if current_user.role != models.UserRole.SERVICE_ENGINEER:
        raise HTTPException(status_code=403, detail="Only service engineers can update status")
    
    service = db.query(models.Complaint).filter(models.Complaint.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update services assigned to you")
    
    if service.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot update completed service")
    
    # Validate status transitions
    valid_transitions = {
        "NEW": ["ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "ON_HOLD"],
        "ASSIGNED": ["ON_THE_WAY", "IN_PROGRESS", "ON_HOLD"],
        "ON_THE_WAY": ["IN_PROGRESS", "ON_HOLD"],
        "IN_PROGRESS": ["COMPLETED", "ON_HOLD"],
        "ON_HOLD": ["ASSIGNED", "ON_THE_WAY", "IN_PROGRESS"]
    }
    
    # Allow idempotent transitions (same status to same status) - just return success
    if update.status and update.status == service.status:
        # Return current service without changes - idempotent operation
        sla_info = check_sla_status(service)
        service.sla_status = sla_info
        service.sla_remaining = sla_info["remaining_seconds"]
        return service
    
    if update.status and update.status not in valid_transitions.get(service.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {service.status} to {update.status}"
        )
    
    # Handle ON_HOLD status (pause SLA) - simplified without sla_paused_at column
    # SLA time remains frozen, will be recalculated when status changes
    
    # Update fields
    if update.status:
        service.status = update.status
    if update.resolution_notes:
        service.resolution_notes = update.resolution_notes
    if update.parts_replaced:
        service.parts_replaced = update.parts_replaced
    
    # Save check-in location if provided
    if update.checkin_latitude is not None:
        service.checkin_latitude = update.checkin_latitude
    if update.checkin_longitude is not None:
        service.checkin_longitude = update.checkin_longitude
    if update.checkin_time:
        from datetime import datetime
        try:
            service.checkin_time = datetime.fromisoformat(update.checkin_time.replace('Z', '+00:00'))
        except:
            service.checkin_time = datetime.utcnow()
    
    db.commit()
    db.refresh(service)
    
    # Add SLA status for response
    sla_info = check_sla_status(service)
    service.sla_status = sla_info
    service.sla_remaining = sla_info["remaining_seconds"]
    
    return service


# === CHECK-IN LOCATION ===

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

@router.put("/{service_id}/location", response_model=schemas.Complaint)
async def update_service_location(
    service_id: int,
    location: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Check-in at service location (SERVICE_ENGINEER only)"""
    if current_user.role != models.UserRole.SERVICE_ENGINEER:
        raise HTTPException(status_code=403, detail="Only service engineers can check in")
    
    service = db.query(models.Complaint).filter(models.Complaint.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    if service.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only check in to services assigned to you")
    
    service.checkin_latitude = location.latitude
    service.checkin_longitude = location.longitude
    service.checkin_time = datetime.utcnow()
    
    db.commit()
    db.refresh(service)
    
    sla_info = check_sla_status(service)
    service.sla_status = sla_info
    service.sla_remaining = sla_info["remaining_seconds"]
    
    return service


@router.post("/{service_id}/complete", response_model=schemas.Complaint)
async def complete_service(
    service_id: int,
    completion_data: schemas.ServiceCompleteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Complete service and generate feedback QR/link (SERVICE_ENGINEER only)"""
    if current_user.role != models.UserRole.SERVICE_ENGINEER:
        raise HTTPException(status_code=403, detail="Only service engineers can complete services")
    
    service = db.query(models.Complaint).filter(models.Complaint.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only complete services assigned to you")
    
    if service.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Service already completed")
    
    if not completion_data.resolution_notes or len(completion_data.resolution_notes.strip()) == 0:
        raise HTTPException(status_code=400, detail="Resolution notes are mandatory")
    
    # Mark as completed
    service.status = "COMPLETED"
    service.completed_at = datetime.utcnow()
    service.resolution_notes = completion_data.resolution_notes
    service.parts_replaced = completion_data.parts_replaced
    
    # Generate feedback URL and QR using environment variable
    # Use service ID directly for feedback link (simpler and trackable)
    feedback_url = f"{FRONTEND_URL}/feedback/{service.id}"
    
    try:
        feedback_qr = generate_feedback_qr(feedback_url)
        service.feedback_url = feedback_url
        service.feedback_qr = feedback_qr
        print(f"✅ Generated feedback QR for service {service.id}: {feedback_url}")
    except Exception as e:
        print(f"❌ Failed to generate feedback QR: {e}")
        service.feedback_url = feedback_url
        service.feedback_qr = None
    
    db.commit()
    db.refresh(service)
    
    # Add SLA status for response
    sla_info = check_sla_status(service)
    service.sla_status = sla_info
    service.sla_remaining = sla_info["remaining_seconds"]
    
    # Notify admin and reception
    background_tasks.add_task(
        NotificationService.notify_service_completed,
        db, service, current_user.full_name
    )
    
    # Check SLA breach
    if service.sla_time and datetime.utcnow() > service.sla_time:
        background_tasks.add_task(
            NotificationService.notify_sla_breach,
            db, service
        )
    
    return service

@router.get("/", response_model=List[schemas.Complaint])
def get_all_services(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_optional)
):
    """Get all service requests (Admin/Reception only)"""
    if not current_user or current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        return []
    
    query = db.query(models.Complaint)
    
    if status:
        query = query.filter(models.Complaint.status == status)
    if priority:
        query = query.filter(models.Complaint.priority == priority)
    
    services = query.offset(skip).limit(limit).all()
    
    # Add SLA status and engineer name
    for service in services:
        sla_info = check_sla_status(service)
        service.sla_status = sla_info  # Return complete dict
        service.sla_remaining = sla_info["remaining_seconds"]
        # Add engineer name if assigned
        if service.assigned_to and service.assigned_engineer:
            service.engineer_name = service.assigned_engineer.full_name
        else:
            service.engineer_name = None
    
    return services

@router.get("/reception/call-stats")
def get_call_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get today's call statistics for reception dashboard"""
    # Only RECEPTION and ADMIN can access
    if current_user.role not in [models.UserRole.RECEPTION, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get today's date range (using local date)
    from datetime import date
    today = date.today()
    
    # Count sales calls made today by call_type
    # HOT = Hot/Interested leads
    # WARM = Warm leads
    # COLD = Cold leads
    hot_calls = db.query(models.SalesCall).filter(
        and_(
            func.date(models.SalesCall.call_date) == today,
            models.SalesCall.call_type == "Hot"
        )
    ).count()
    
    warm_calls = db.query(models.SalesCall).filter(
        and_(
            func.date(models.SalesCall.call_date) == today,
            models.SalesCall.call_type == "Warm"
        )
    ).count()
    
    cold_calls = db.query(models.SalesCall).filter(
        and_(
            func.date(models.SalesCall.call_date) == today,
            models.SalesCall.call_type == "Cold"
        )
    ).count()
    
    total_calls = hot_calls + warm_calls + cold_calls
    
    return {
        "total": total_calls,
        "hot": hot_calls,
        "warm": warm_calls,
        "cold": cold_calls
    }

@router.get("/{service_id}/feedback", response_model=List[schemas.Feedback])
def get_service_feedback(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get feedback for a service request"""
    service = db.query(models.Complaint).filter(models.Complaint.id == service_id).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # RBAC check
    if current_user.role == models.UserRole.SERVICE_ENGINEER:
        if service.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.service_request_id == service_id
    ).all()
    
    return feedbacks
