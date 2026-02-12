from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import schemas
import models
import auth
from database import get_db
from notification_service import NotificationService

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.post("/", response_model=schemas.Feedback)
async def submit_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db)
):
    """Submit feedback for a completed service (Public endpoint)"""
    
    # Verify service request exists and is completed
    service = db.query(models.Complaint).filter(
        models.Complaint.id == feedback.service_request_id
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot submit feedback for incomplete service")
    
    # Check if feedback already exists
    existing_feedback = db.query(models.Feedback).filter(
        models.Feedback.service_request_id == feedback.service_request_id
    ).first()
    
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this service")
    
    # Validate rating
    if feedback.rating < 1 or feedback.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Determine if negative feedback
    is_negative = feedback.rating <= 2
    
    # Create feedback
    db_feedback = models.Feedback(
        service_request_id=feedback.service_request_id,
        customer_name=feedback.customer_name,
        rating=feedback.rating,
        comment=feedback.comment,
        is_negative=is_negative,
        escalated=is_negative,  # Auto-escalate negative feedback
        created_at=datetime.utcnow()
    )
    
    db.add(db_feedback)
    
    db.commit()
    db.refresh(db_feedback)
    
    # Notify admin and engineer if negative
    if is_negative:
        try:
            NotificationService.notify_negative_feedback(db, service, db_feedback)
        except Exception as e:
            print(f"Failed to send negative feedback notification: {e}")
    
    return db_feedback

@router.get("/engineer/my-feedback")
def get_engineer_feedbacks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all feedbacks for services completed by current engineer"""
    if current_user.role != models.UserRole.SERVICE_ENGINEER:
        raise HTTPException(status_code=403, detail="Only service engineers can access this")
    
    # Get all completed services by engineer
    services = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == current_user.id,
        models.Complaint.status == "COMPLETED",
        models.Complaint.assigned_to.isnot(None)
    ).all()
    
    service_ids = [s.id for s in services]
    
    if not service_ids:
        return []
    
    # Get all feedbacks for these services
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.service_request_id.in_(service_ids)
    ).order_by(models.Feedback.created_at.desc()).all()
    
    # Enrich feedbacks with service request details
    result = []
    for feedback in feedbacks:
        service = db.query(models.Complaint).filter(
            models.Complaint.id == feedback.service_request_id
        ).first()
        
        feedback_dict = {
            "id": feedback.id,
            "service_request_id": feedback.service_request_id,
            "customer_name": feedback.customer_name,
            "rating": feedback.rating,
            "comment": feedback.comment,
            "comments": feedback.comment,  # Alias for frontend compatibility
            "is_negative": feedback.is_negative,
            "escalated": feedback.escalated,
            "created_at": feedback.created_at,
            # Add service request details
            "ticket_no": service.ticket_no if service else None,
            "issue_description": service.fault_description if service else None,
            "location": service.address if service else None,
            "customer_company": service.company if service else None,
        }
        result.append(feedback_dict)
    
    return result

@router.get("/engineer/analytics")
def get_engineer_analytics(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get feedback analytics for engineer (SERVICE_ENGINEER or ADMIN viewing)"""
    # Allow admin to view any engineer's analytics by passing user_id
    if current_user.role == models.UserRole.ADMIN and user_id:
        target_user_id = user_id
    elif current_user.role == models.UserRole.SERVICE_ENGINEER:
        target_user_id = current_user.id
    else:
        raise HTTPException(status_code=403, detail="Only service engineers can access this")
    
    # Get all completed services by engineer
    services = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == target_user_id,
        models.Complaint.status == "COMPLETED",
        models.Complaint.assigned_to.isnot(None)
    ).all()
    
    service_ids = [s.id for s in services]
    
    # Get all feedbacks
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.service_request_id.in_(service_ids)
    ).all()
    
    if not feedbacks:
        return {
            "total_jobs_completed": len(services),
            "feedback_count": 0,
            "average_rating": 0,
            "negative_count": 0,
            "negative_percentage": 0,
            "performance_score": 0,
            "sla_compliance_rate": 0
        }
    
    total_feedbacks = len(feedbacks)
    total_rating = sum(f.rating for f in feedbacks)
    average_rating = round(total_rating / total_feedbacks, 2)
    negative_count = sum(1 for f in feedbacks if f.is_negative)
    negative_percentage = round((negative_count / total_feedbacks) * 100, 2)
    
    # Calculate SLA compliance
    completed_services = [s for s in services if s.completed_at]
    sla_compliant = sum(
        1 for s in completed_services
        if s.sla_time and s.completed_at <= s.sla_time
    )
    sla_compliance = round(
        (sla_compliant / len(completed_services)) * 100, 2
    ) if completed_services else 0
    
    # Performance Score = (Avg Rating × 0.6) + (SLA Compliance % × 0.4)
    performance_score = round(
        (average_rating / 5 * 100 * 0.6) + (sla_compliance * 0.4),
        2
    )
    
    return {
        "total_jobs_completed": len(services),
        "feedback_count": total_feedbacks,
        "average_rating": average_rating,
        "negative_count": negative_count,
        "negative_percentage": negative_percentage,
        "sla_compliance_rate": sla_compliance / 100,  # Frontend expects decimal (0-1)
        "sla_compliance_percentage": sla_compliance,  # Keep for backward compatibility
        "performance_score": performance_score
    }

@router.get("/admin/analytics")
def get_all_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get feedback analytics for all engineers (Admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can access this")
    
    # Get all service engineers
    engineers = db.query(models.User).filter(
        models.User.role == models.UserRole.SERVICE_ENGINEER
    ).all()
    
    analytics = []
    
    for engineer in engineers:
        services = db.query(models.Complaint).filter(
            models.Complaint.assigned_to == engineer.id,
            models.Complaint.status == "COMPLETED"
        ).all()
        
        service_ids = [s.id for s in services]
        
        feedbacks = db.query(models.Feedback).filter(
            models.Feedback.service_request_id.in_(service_ids)
        ).all() if service_ids else []
        
        if feedbacks:
            total_feedbacks = len(feedbacks)
            average_rating = round(sum(f.rating for f in feedbacks) / total_feedbacks, 2)
            negative_count = sum(1 for f in feedbacks if f.is_negative)
            
            # SLA compliance
            completed_services = [s for s in services if s.completed_at]
            sla_compliant = sum(
                1 for s in completed_services
                if s.sla_due and s.completed_at <= s.sla_due
            )
            sla_compliance = round(
                (sla_compliant / len(completed_services)) * 100, 2
            ) if completed_services else 0
            
            performance_score = round(
                (average_rating / 5 * 100 * 0.6) + (sla_compliance * 0.4),
                2
            )
        else:
            total_feedbacks = 0
            average_rating = 0
            negative_count = 0
            sla_compliance = 0
            performance_score = 0
        
        analytics.append({
            "engineer_id": engineer.id,
            "engineer_name": engineer.full_name,
            "total_services": len(services),
            "total_feedbacks": total_feedbacks,
            "average_rating": average_rating,
            "negative_count": negative_count,
            "sla_compliance": sla_compliance,
            "performance_score": performance_score
        })
    
    # Sort by performance score
    analytics.sort(key=lambda x: x["performance_score"], reverse=True)
    
    return analytics

@router.get("/negative", response_model=List[schemas.Feedback])
def get_negative_feedbacks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all negative feedbacks (Admin/Reception only)"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.is_negative == True
    ).order_by(models.Feedback.created_at.desc()).all()
    
    return feedbacks
