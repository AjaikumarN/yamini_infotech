"""
Staff Notification & Communication Queue API Endpoints
=======================================================

Staff notifications:
  GET  /api/notifications/my           — paginated list for current user
  GET  /api/notifications/unread-count — badge count
  PUT  /api/notifications/{id}/read    — mark single read
  PUT  /api/notifications/read-all     — mark all read

Communication queue (admin only):
  GET  /api/communications/queue       — queue status overview
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from datetime import datetime

import models
import auth
from database import get_db

router = APIRouter(tags=["Staff Notifications"])


# =========================================================================
# STAFF NOTIFICATIONS
# =========================================================================

@router.get("/api/notifications/my")
def get_my_notifications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get paginated notifications for the current user."""
    where = "WHERE sn.user_id = :uid"
    if unread_only:
        where += " AND sn.is_read = FALSE"

    rows = db.execute(text(f"""
        SELECT sn.id, sn.title, sn.message, sn.module,
               sn.entity_type, sn.entity_id, sn.priority,
               sn.is_read, sn.action_url, sn.created_at, sn.read_at
        FROM staff_notifications sn
        {where}
        ORDER BY sn.created_at DESC
        LIMIT :lim OFFSET :off
    """), {"uid": current_user.id, "lim": limit, "off": offset}).fetchall()

    return [
        {
            "id": r[0], "title": r[1], "message": r[2], "module": r[3],
            "entity_type": r[4], "entity_id": r[5], "priority": r[6],
            "is_read": r[7], "action_url": r[8],
            "created_at": r[9].isoformat() if r[9] else None,
            "read_at": r[10].isoformat() if r[10] else None,
        }
        for r in rows
    ]


@router.get("/api/notifications/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Return the unread badge count."""
    count = db.execute(text("""
        SELECT COUNT(*) FROM staff_notifications
        WHERE user_id = :uid AND is_read = FALSE
    """), {"uid": current_user.id}).scalar()
    return {"unread_count": count or 0}


@router.get("/api/notifications/badge-counts")
def get_badge_counts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Return badge counts for sidebar navigation items.
    Uses is_viewed field for role-based unread tracking.
    - Admin/Reception: unviewed enquiries and complaints
    - Salesman: their unviewed assigned enquiries
    - Service Engineer: their unviewed assigned complaints
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    
    # Enquiries badge - unviewed enquiries (not soft-deleted)
    if user_role in ['ADMIN', 'RECEPTION']:
        enquiry_count = db.execute(text("""
            SELECT COUNT(*) FROM enquiries
            WHERE is_deleted = FALSE AND is_viewed = FALSE
        """)).scalar() or 0
    elif user_role == 'SALESMAN':
        enquiry_count = db.execute(text("""
            SELECT COUNT(*) FROM enquiries
            WHERE is_deleted = FALSE AND is_viewed = FALSE AND assigned_to = :uid
        """), {"uid": current_user.id}).scalar() or 0
    else:
        enquiry_count = 0
    
    # Complaints/Service Requests badge - unviewed complaints
    if user_role in ['ADMIN', 'RECEPTION']:
        complaint_count = db.execute(text("""
            SELECT COUNT(*) FROM complaints
            WHERE is_deleted = FALSE AND is_viewed = FALSE
        """)).scalar() or 0
    elif user_role == 'SERVICE_ENGINEER':
        complaint_count = db.execute(text("""
            SELECT COUNT(*) FROM complaints
            WHERE is_deleted = FALSE AND is_viewed = FALSE AND assigned_to = :uid
        """), {"uid": current_user.id}).scalar() or 0
    else:
        complaint_count = 0
    
    # Orders badge - pending orders not viewed
    if user_role in ['ADMIN', 'RECEPTION']:
        order_count = db.execute(text("""
            SELECT COUNT(*) FROM orders
            WHERE is_deleted = FALSE AND is_viewed = FALSE AND status = 'PENDING'
        """)).scalar() or 0
    elif user_role == 'SALESMAN':
        order_count = db.execute(text("""
            SELECT COUNT(*) FROM orders
            WHERE is_deleted = FALSE AND is_viewed = FALSE AND salesman_id = :uid
        """), {"uid": current_user.id}).scalar() or 0
    else:
        order_count = 0
    
    # Staff notifications badge
    notification_count = db.execute(text("""
        SELECT COUNT(*) FROM staff_notifications
        WHERE user_id = :uid AND is_read = FALSE
    """), {"uid": current_user.id}).scalar() or 0
    
    return {
        "enquiries": enquiry_count,
        "complaints": complaint_count,
        "orders": order_count,
        "notifications": notification_count,
        "total": enquiry_count + complaint_count + order_count + notification_count
    }


@router.put("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Mark a single notification as read."""
    result = db.execute(text("""
        UPDATE staff_notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE id = :nid AND user_id = :uid AND is_read = FALSE
        RETURNING id
    """), {"nid": notification_id, "uid": current_user.id})
    db.commit()
    row = result.fetchone()
    if not row:
        raise HTTPException(404, "Notification not found or already read")
    return {"status": "ok", "id": notification_id}


@router.put("/api/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Mark all unread notifications as read for the current user."""
    result = db.execute(text("""
        UPDATE staff_notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE user_id = :uid AND is_read = FALSE
    """), {"uid": current_user.id})
    db.commit()
    return {"status": "ok", "marked": result.rowcount}


@router.put("/api/notifications/mark-viewed/{module}")
def mark_module_items_viewed(
    module: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Mark all items in a module as viewed (for badge counter logic).
    Module: enquiries | complaints | orders
    
    When user opens the Enquiry Board, Complaints page, or Orders page,
    frontend should call this endpoint to clear the badge count.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    marked = 0
    
    if module == 'enquiries':
        if user_role in ['ADMIN', 'RECEPTION']:
            result = db.execute(text("""
                UPDATE enquiries SET is_viewed = TRUE
                WHERE is_deleted = FALSE AND is_viewed = FALSE
            """))
            marked = result.rowcount
        elif user_role == 'SALESMAN':
            result = db.execute(text("""
                UPDATE enquiries SET is_viewed = TRUE
                WHERE is_deleted = FALSE AND is_viewed = FALSE AND assigned_to = :uid
            """), {"uid": current_user.id})
            marked = result.rowcount
    
    elif module == 'complaints':
        if user_role in ['ADMIN', 'RECEPTION']:
            result = db.execute(text("""
                UPDATE complaints SET is_viewed = TRUE
                WHERE is_deleted = FALSE AND is_viewed = FALSE
            """))
            marked = result.rowcount
        elif user_role == 'SERVICE_ENGINEER':
            result = db.execute(text("""
                UPDATE complaints SET is_viewed = TRUE
                WHERE is_deleted = FALSE AND is_viewed = FALSE AND assigned_to = :uid
            """), {"uid": current_user.id})
            marked = result.rowcount
    
    elif module == 'orders':
        if user_role in ['ADMIN', 'RECEPTION']:
            result = db.execute(text("""
                UPDATE orders SET is_viewed = TRUE
                WHERE is_deleted = FALSE AND is_viewed = FALSE
            """))
            marked = result.rowcount
        elif user_role == 'SALESMAN':
            result = db.execute(text("""
                UPDATE orders SET is_viewed = TRUE
                WHERE is_deleted = FALSE AND is_viewed = FALSE AND salesman_id = :uid
            """), {"uid": current_user.id})
            marked = result.rowcount
    else:
        raise HTTPException(400, "Invalid module. Use: enquiries, complaints, or orders")
    
    db.commit()
    return {"status": "ok", "module": module, "marked_viewed": marked}


# =========================================================================
# COMMUNICATION QUEUE (admin overview)
# =========================================================================

@router.get("/api/communications/queue")
def get_queue_status(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Admin-only: view communication queue status."""
    if current_user.role not in ("ADMIN", "RECEPTION"):
        raise HTTPException(403, "Admin access required")

    where = ""
    params = {"lim": limit}
    if status:
        where = "WHERE cq.status = :st"
        params["st"] = status.upper()

    rows = db.execute(text(f"""
        SELECT cq.id, cq.channel, cq.recipient_phone, cq.event_type,
               cq.status, cq.retry_count, cq.last_error,
               cq.created_at, cq.processed_at
        FROM communication_queue cq
        {where}
        ORDER BY cq.created_at DESC
        LIMIT :lim
    """), params).fetchall()

    # Also get summary counts
    summary = db.execute(text("""
        SELECT status, COUNT(*) FROM communication_queue GROUP BY status
    """)).fetchall()

    return {
        "summary": {r[0]: r[1] for r in summary},
        "jobs": [
            {
                "id": r[0], "channel": r[1], "phone": r[2], "event_type": r[3],
                "status": r[4], "retries": r[5], "last_error": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "processed_at": r[8].isoformat() if r[8] else None,
            }
            for r in rows
        ],
    }
