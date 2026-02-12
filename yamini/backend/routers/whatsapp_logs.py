"""
WhatsApp Message Logs API Router
=================================

Provides endpoints for viewing WhatsApp message audit logs.
Used by Admin and Reception dashboards.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel
from database import get_db
from auth import get_current_user
import models


router = APIRouter(prefix="/whatsapp-logs", tags=["WhatsApp Logs"])


# =============================================================================
# Pydantic Schemas
# =============================================================================

class WhatsAppLogResponse(BaseModel):
    id: int
    event_type: str
    customer_phone: str
    customer_name: Optional[str] = None
    message_content: str
    status: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime
    sent_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class WhatsAppLogSummary(BaseModel):
    total_messages: int
    sent_count: int
    failed_count: int
    pending_count: int
    retrying_count: int
    today_count: int
    this_week_count: int


class WhatsAppLogListResponse(BaseModel):
    logs: List[WhatsAppLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("", response_model=WhatsAppLogListResponse)
async def get_whatsapp_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, SENT, FAILED, RETRYING)"),
    from_date: Optional[date] = Query(None, description="Filter from date"),
    to_date: Optional[date] = Query(None, description="Filter to date"),
    search: Optional[str] = Query(None, description="Search by phone or customer name"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get paginated WhatsApp message logs with filters.
    
    Accessible by: Admin, Reception, Manager
    """
    
    # Check permission
    allowed_roles = [models.UserRole.ADMIN, models.UserRole.RECEPTION]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to view WhatsApp logs")
    
    try:
        # Build query
        query = "SELECT * FROM whatsapp_message_logs WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM whatsapp_message_logs WHERE 1=1"
        params = {}
        
        # Apply filters
        if event_type:
            query += " AND event_type = :event_type"
            count_query += " AND event_type = :event_type"
            params['event_type'] = event_type
        
        if status:
            query += " AND status = :status"
            count_query += " AND status = :status"
            params['status'] = status.upper()
        
        if from_date:
            query += " AND DATE(created_at) >= :from_date"
            count_query += " AND DATE(created_at) >= :from_date"
            params['from_date'] = from_date
        
        if to_date:
            query += " AND DATE(created_at) <= :to_date"
            count_query += " AND DATE(created_at) <= :to_date"
            params['to_date'] = to_date
        
        if search:
            query += " AND (customer_phone ILIKE :search OR customer_name ILIKE :search)"
            count_query += " AND (customer_phone ILIKE :search OR customer_name ILIKE :search)"
            params['search'] = f"%{search}%"
        
        # Get total count
        total = db.execute(text(count_query), params).scalar()
        
        # Add ordering and pagination
        query += " ORDER BY created_at DESC"
        query += " LIMIT :limit OFFSET :offset"
        params['limit'] = page_size
        params['offset'] = (page - 1) * page_size
        
        # Execute query
        result = db.execute(text(query), params).fetchall()
        
        # Convert to response
        logs = []
        for row in result:
            logs.append(WhatsAppLogResponse(
                id=row.id,
                event_type=row.event_type,
                customer_phone=row.customer_phone,
                customer_name=row.customer_name,
                message_content=row.message_content,
                status=row.status,
                reference_type=row.reference_type,
                reference_id=row.reference_id,
                error_message=row.error_message,
                retry_count=row.retry_count,
                created_at=row.created_at,
                sent_at=row.sent_at
            ))
        
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        
        return WhatsAppLogListResponse(
            logs=logs,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")


@router.get("/summary", response_model=WhatsAppLogSummary)
async def get_whatsapp_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get summary statistics for WhatsApp messages.
    
    Accessible by: Admin, Reception, Manager
    """
    
    # Check permission
    allowed_roles = [models.UserRole.ADMIN, models.UserRole.RECEPTION]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to view WhatsApp logs")
    
    try:
        # Total messages
        total = db.execute(text("SELECT COUNT(*) FROM whatsapp_message_logs")).scalar() or 0
        
        # Status counts
        sent = db.execute(text("SELECT COUNT(*) FROM whatsapp_message_logs WHERE status = 'SENT'")).scalar() or 0
        failed = db.execute(text("SELECT COUNT(*) FROM whatsapp_message_logs WHERE status = 'FAILED'")).scalar() or 0
        pending = db.execute(text("SELECT COUNT(*) FROM whatsapp_message_logs WHERE status = 'PENDING'")).scalar() or 0
        retrying = db.execute(text("SELECT COUNT(*) FROM whatsapp_message_logs WHERE status = 'RETRYING'")).scalar() or 0
        
        # Today's messages
        today = db.execute(text("""
            SELECT COUNT(*) FROM whatsapp_message_logs 
            WHERE DATE(created_at) = CURRENT_DATE
        """)).scalar() or 0
        
        # This week's messages
        this_week = db.execute(text("""
            SELECT COUNT(*) FROM whatsapp_message_logs 
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        """)).scalar() or 0
        
        return WhatsAppLogSummary(
            total_messages=total,
            sent_count=sent,
            failed_count=failed,
            pending_count=pending,
            retrying_count=retrying,
            today_count=today,
            this_week_count=this_week
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching summary: {str(e)}")


@router.get("/event-types")
async def get_event_types(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get list of all WhatsApp event types for filtering.
    """
    return {
        "event_types": [
            {"value": "enquiry_created", "label": "Enquiry Created"},
            {"value": "service_created", "label": "Service Created"},
            {"value": "engineer_assigned", "label": "Engineer Assigned"},
            {"value": "service_completed", "label": "Service Completed"},
            {"value": "delivery_failed", "label": "Delivery Failed"},
            {"value": "delivery_reattempt", "label": "Delivery Re-attempt"},
        ]
    }


@router.post("/retry/{log_id}")
async def retry_failed_message(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retry a failed WhatsApp message.
    
    Accessible by: Admin only
    """
    
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can retry messages")
    
    try:
        # Get the log entry
        result = db.execute(text("""
            SELECT * FROM whatsapp_message_logs WHERE id = :id
        """), {"id": log_id}).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Message log not found")
        
        if result.status == 'SENT':
            raise HTTPException(status_code=400, detail="Message already sent successfully")
        
        # Update status to RETRYING
        db.execute(text("""
            UPDATE whatsapp_message_logs 
            SET status = 'RETRYING', retry_count = retry_count + 1
            WHERE id = :id
        """), {"id": log_id})
        db.commit()
        
        # Note: Actual retry would be handled by a background job
        # For now, we just mark it for retry
        
        return {"message": "Message queued for retry", "log_id": log_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error retrying message: {str(e)}")


@router.get("/by-reference/{reference_type}/{reference_id}")
async def get_logs_by_reference(
    reference_type: str,
    reference_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all WhatsApp logs for a specific reference (e.g., complaint #123).
    
    Accessible by: Admin, Reception, Manager
    """
    
    allowed_roles = [models.UserRole.ADMIN, models.UserRole.RECEPTION]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to view WhatsApp logs")
    
    try:
        result = db.execute(text("""
            SELECT * FROM whatsapp_message_logs 
            WHERE reference_type = :ref_type AND reference_id = :ref_id
            ORDER BY created_at DESC
        """), {"ref_type": reference_type, "ref_id": reference_id}).fetchall()
        
        logs = []
        for row in result:
            logs.append(WhatsAppLogResponse(
                id=row.id,
                event_type=row.event_type,
                customer_phone=row.customer_phone,
                customer_name=row.customer_name,
                message_content=row.message_content,
                status=row.status,
                reference_type=row.reference_type,
                reference_id=row.reference_id,
                error_message=row.error_message,
                retry_count=row.retry_count,
                created_at=row.created_at,
                sent_at=row.sent_at
            ))
        
        return {"logs": logs, "total": len(logs)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching logs: {str(e)}")
    