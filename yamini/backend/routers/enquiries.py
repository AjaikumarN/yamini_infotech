from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import schemas
import crud
import models
import auth
from database import get_db
from notification_service import NotificationService
from services.whatsapp_service import WhatsAppMessageTemplates
from services.communication_queue import queue_customer_whatsapp, notify_roles

router = APIRouter(prefix="/api/enquiries", tags=["Enquiries"])

@router.post("", response_model=schemas.Enquiry)
def create_enquiry(
    enquiry: schemas.EnquiryCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    """Create a new enquiry (Public endpoint - no authentication required for website submissions)"""
    # Determine who created the enquiry
    created_by_name = current_user.full_name if current_user else "Website Visitor"
    
    # Auto-assign to salesman if they created it
    if current_user and current_user.role == models.UserRole.SALESMAN:
        # Convert to dict to modify
        enquiry_dict = enquiry.dict()
        enquiry_dict['assigned_to'] = current_user.id
        # Create new schema object with assigned_to
        enquiry = schemas.EnquiryCreate(**enquiry_dict)
    
    # Create enquiry
    new_enquiry = crud.create_enquiry(db=db, enquiry=enquiry, created_by=created_by_name)
    
    # Send notifications for all enquiry submissions (internal and public)
    try:
        NotificationService.notify_enquiry_created(
            db=db,
            enquiry=new_enquiry,
            created_by_name=created_by_name
        )
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to send enquiry notifications: {e}")
    
    # Queue WhatsApp notification to customer (worker sends it)
    try:
        if getattr(new_enquiry, 'phone', None):
            msg = WhatsAppMessageTemplates.enquiry_created(
                customer_name=new_enquiry.customer_name or "Customer",
                enquiry_id=new_enquiry.enquiry_id or f"ENQ-{new_enquiry.id}",
                subject=new_enquiry.product_interest or "Product Enquiry",
            )
            queue_customer_whatsapp(
                db=db, event_type="ENQUIRY_CREATED",
                phone=new_enquiry.phone, message=msg,
                reference_table="enquiries", reference_id=new_enquiry.id,
                customer_name=new_enquiry.customer_name,
            )
    except Exception as e:
        import logging
        logging.error(f"Failed to queue WhatsApp notification: {e}")

    # Staff notification → Admin + Reception
    try:
        notify_roles(
            db=db, roles=["ADMIN", "RECEPTION"],
            title="New Enquiry Created",
            message=f"Enquiry {new_enquiry.enquiry_id or new_enquiry.id} from {new_enquiry.customer_name or 'Website'}",
            module="enquiries", entity_type="enquiry", entity_id=new_enquiry.id,
            priority="HIGH", action_url="/reception",
        )
    except Exception:
        pass

    return new_enquiry

@router.get("", response_model=List[schemas.Enquiry])
def get_enquiries(
    skip: int = 0,
    limit: int = 100,
    assigned_to: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get enquiries (Backend enforced: Reception=all, Salesman=assigned only)"""
    
    # Build base query
    query = db.query(models.Enquiry)
    
    # Apply role-based filtering (Backend enforcement)
    query = auth.filter_enquiries_by_role(current_user, query)
    
    # Apply additional filters for Admin/Reception
    if current_user.role in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        if assigned_to:
            query = query.filter(models.Enquiry.assigned_to == assigned_to)
    
    # Execute with pagination
    enquiries = query.offset(skip).limit(limit).all()
    return enquiries

@router.get("/{enquiry_id}", response_model=schemas.Enquiry)
def get_enquiry_by_id(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get a specific enquiry by ID"""
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    # Role-based access control
    if current_user.role == models.UserRole.SALESMAN:
        if enquiry.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view enquiries assigned to you")
    
    return enquiry

@router.put("/{enquiry_id}", response_model=schemas.Enquiry)
def update_enquiry(
    enquiry_id: int,
    enquiry: schemas.EnquiryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_enquiry_write)  # Admin + Reception
):
    """Update enquiry (Admin + Reception only - Backend enforced)"""
    # Get the old enquiry to check if assignment changed
    old_enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    if not old_enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    old_assigned_to = old_enquiry.assigned_to
    
    # Update enquiry
    updated = crud.update_enquiry(db, enquiry_id=enquiry_id, enquiry=enquiry)
    
    # PHASE 4: Send notification if assignment changed
    if enquiry.assigned_to and enquiry.assigned_to != old_assigned_to:
        try:
            NotificationService.notify_enquiry_created(
                db=db,
                enquiry=updated,
                created_by_name=current_user.full_name
            )
        except Exception as e:
            # Log error but don't fail the request
            import logging
            logging.error(f"Failed to send enquiry assignment notifications: {e}")
    
    return updated

@router.delete("/{enquiry_id}")
def delete_enquiry(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_enquiry_write)  # Admin + Reception
):
    """Delete enquiry (Admin + Reception only - Backend enforced)"""
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    db.delete(enquiry)
    db.commit()
    return {"message": "Enquiry deleted successfully"}

# Follow-up endpoints
@router.post("/followups", response_model=schemas.FollowUp)
def create_followup(
    followup: schemas.FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new follow-up (Salesman, Reception, or Admin) - Attendance required for Salesman"""
    
    # RECEPTION and ADMIN can create follow-ups without attendance check
    # SALESMAN must have attendance marked
    if current_user.role == models.UserRole.SALESMAN:
        # Check attendance for salesman
        today = date.today()
        attendance = db.query(models.Attendance).filter(
            models.Attendance.employee_id == current_user.id,
            models.Attendance.attendance_date == today,
            models.Attendance.status == "Present"
        ).first()
        if not attendance:
            raise HTTPException(status_code=403, detail="Attendance not marked for today")
    elif current_user.role not in [models.UserRole.RECEPTION, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only salesmen, reception, and admin can create follow-ups")
    
    # Verify enquiry exists
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == followup.enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    # Salesman can only create follow-ups for their assigned enquiries
    if current_user.role == models.UserRole.SALESMAN and enquiry.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You can only create follow-ups for your assigned enquiries")
    
    # 📘 NOTEBOOK RULE: Max 5 pending follow-ups without status change → alert Reception
    pending_count = db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.enquiry_id == followup.enquiry_id,
        models.SalesFollowUp.status == "Pending"
    ).count()
    
    if pending_count >= 5 and enquiry.status == "NEW":
        # Send alert to reception
        try:
            NotificationService.create_notification(
                db=db,
                title=f"⚠️ Excessive Follow-ups: {enquiry.customer_name}",
                message=f"Enquiry #{enquiry.enquiry_id} has {pending_count} pending follow-ups without conversion by {current_user.full_name}",
                type="ALERT",
                user_id=None,  # To all reception
                role=models.UserRole.RECEPTION
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to send follow-up alert: {e}")
    
    # For salesman, use their ID; for reception, use the assigned salesman or None
    salesman_id = current_user.id if current_user.role == models.UserRole.SALESMAN else enquiry.assigned_to
    
    try:
        return crud.create_followup(db=db, followup=followup, salesman_id=salesman_id, created_by=current_user.id)
    except Exception as e:
        import logging
        logging.error(f"Failed to create follow-up: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create follow-up: {str(e)}")

@router.get("/{enquiry_id}/followups", response_model=List[schemas.FollowUp])
def get_enquiry_followups(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all follow-ups for a specific enquiry"""
    # Verify enquiry exists
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    # Role-based access control
    if current_user.role == models.UserRole.SALESMAN:
        if enquiry.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view follow-ups for your assigned enquiries")
    
    # Get followups for this enquiry
    followups = db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.enquiry_id == enquiry_id
    ).order_by(models.SalesFollowUp.created_at.desc()).all()
    
    return followups

@router.put("/followups/{followup_id}", response_model=schemas.FollowUp)
def update_followup(
    followup_id: int,
    followup: schemas.FollowUpUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Update follow-up status (Salesman only) - Attendance required"""
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can update follow-ups")
    
    # Verify this followup belongs to the salesman
    db_followup = db.query(models.SalesFollowUp).filter(models.SalesFollowUp.id == followup_id).first()
    if not db_followup or db_followup.salesman_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own follow-ups")
    
    updated = crud.update_followup(db=db, followup_id=followup_id, followup=followup)
    if not updated:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    return updated

@router.get("/followups/mine", response_model=List[schemas.FollowUp])
def get_my_followups(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Get my follow-ups (Salesman only) - Attendance required"""
    if current_user.role != models.UserRole.SALESMAN:
        raise HTTPException(status_code=403, detail="Only salesmen can view follow-ups")
    
    return crud.get_followups_by_salesman(db=db, salesman_id=current_user.id, status=status)
