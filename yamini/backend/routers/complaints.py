from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas
import crud
import models
import auth
from database import get_db
from services.whatsapp_service import WhatsAppService
import logging

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.post("/", response_model=schemas.Complaint)
def create_complaint(
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new complaint/service request"""
    new_complaint = crud.create_complaint(db=db, complaint=complaint)
    
    # Send WhatsApp notification to customer (idempotent - only once)
    try:
        whatsapp = WhatsAppService()
        whatsapp.send_service_created(db, new_complaint)
    except Exception as e:
        logging.error(f"Failed to send WhatsApp notification for service creation: {e}")
    
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
