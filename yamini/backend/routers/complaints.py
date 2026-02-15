from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas
import crud
import models
import auth
from database import get_db
from services.whatsapp_service import WhatsAppMessageTemplates
from services.communication_queue import queue_customer_whatsapp, notify_roles
import logging
import os

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.post("/", response_model=schemas.Complaint)
def create_complaint(
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new complaint/service request"""
    new_complaint = crud.create_complaint(db=db, complaint=complaint)
    
    # Queue WhatsApp notification to customer (worker sends it)
    try:
        if getattr(new_complaint, 'phone', None):
            frontend_url = os.getenv("FRONTEND_URL", "https://yaminicopier.com")
            tracking_link = f"{frontend_url}/track/{new_complaint.ticket_no or new_complaint.id}"
            scheduled_date = "To be scheduled"
            if hasattr(new_complaint, 'sla_time') and new_complaint.sla_time:
                scheduled_date = new_complaint.sla_time.strftime("%d/%m/%Y")
            msg = WhatsAppMessageTemplates.service_created(
                customer_name=new_complaint.customer_name or "Customer",
                ticket_id=new_complaint.ticket_no or f"SRV-{new_complaint.id}",
                service_type=new_complaint.machine_model or "Service Request",
                scheduled_date=scheduled_date,
                tracking_link=tracking_link,
            )
            queue_customer_whatsapp(
                db=db, event_type="SERVICE_CREATED",
                phone=new_complaint.phone, message=msg,
                reference_table="complaints", reference_id=new_complaint.id,
                customer_name=new_complaint.customer_name,
            )
    except Exception as e:
        logging.error(f"Failed to queue WhatsApp for service creation: {e}")

    # Staff notification → Admin
    try:
        notify_roles(
            db=db, roles=["ADMIN"],
            title="New Service Request",
            message=f"Ticket {new_complaint.ticket_no or new_complaint.id} from {new_complaint.customer_name or 'Customer'}",
            module="complaints", entity_type="complaint", entity_id=new_complaint.id,
            priority="HIGH", action_url="/service",
        )
    except Exception:
        pass

    return new_complaint

@router.get("/", response_model=List[schemas.Complaint])
def get_complaints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all complaints"""
    return crud.get_complaints(db, skip=skip, limit=limit)

@router.get("/my-complaints", response_model=List[schemas.Complaint])
def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get complaints assigned to current service engineer"""
    if current_user.role != models.UserRole.SERVICE_ENGINEER:
        raise HTTPException(status_code=403, detail="Only service engineers can access this")
    
    return crud.get_complaints_by_engineer(db, engineer_id=current_user.id)

@router.put("/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update complaint status"""
    updated = crud.update_complaint_status(db, complaint_id=complaint_id, status=status)
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return updated
