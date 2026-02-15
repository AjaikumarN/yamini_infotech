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
