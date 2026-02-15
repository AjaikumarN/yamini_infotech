"""
Communication Queue Service
============================

Routers call this service to queue messages instead of sending directly.
Pattern: API event → INSERT queue job → worker sends message.

Usage in routers:
    from services.communication_queue import queue_customer_whatsapp, queue_staff_notification

    # Queue a customer WhatsApp message
    queue_customer_whatsapp(
        db=db,
        event_type="ENQUIRY_CREATED",
        phone=customer.phone,
        message=message_text,
        reference_table="enquiries",
        reference_id=enquiry.id,
    )

    # Queue a staff notification
    queue_staff_notification(
        db=db,
        user_id=admin.id,
        title="New Enquiry",
        message="Enquiry ENQ-123 created",
        module="enquiries",
        entity_type="enquiry",
        entity_id=123,
        priority="HIGH",
        action_url="/reception",
    )
"""

import json
import logging
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)


# =========================================================================
# CUSTOMER MESSAGING (EXTERNAL — via communication_queue table)
# =========================================================================

def queue_customer_whatsapp(
    db: Session,
    event_type: str,
    phone: str,
    message: str,
    reference_table: str = None,
    reference_id: int = None,
    customer_name: str = None,
    channel: str = "WHATSAPP",
) -> Optional[int]:
    """
    Insert a job into communication_queue.
    Worker picks it up and sends via WhatsApp.
    Idempotency key = (event_type + reference_table + reference_id + channel)
    Returns the queue row id or None if duplicate.
    """
    if not phone:
        logger.warning("queue_customer_whatsapp: no phone provided, skipping")
        return None

    # Build idempotency key
    idem_key = None
    if reference_table and reference_id:
        idem_key = f"{event_type}:{reference_table}:{reference_id}:{channel}"

    payload = json.dumps({
        "phone": phone,
        "message": message,
        "customer_name": customer_name or "",
    })

    try:
        result = db.execute(text("""
            INSERT INTO communication_queue
                (channel, recipient_type, recipient_phone, event_type,
                 reference_table, reference_id, message_payload_json,
                 status, retry_count, idempotency_key, created_at)
            VALUES
                (:channel, 'CUSTOMER', :phone, :event_type,
                 :ref_table, :ref_id, :payload,
                 'QUEUED', 0, :idem_key, NOW())
            ON CONFLICT (idempotency_key) DO NOTHING
            RETURNING id
        """), {
            "channel": channel,
            "phone": phone,
            "event_type": event_type,
            "ref_table": reference_table,
            "ref_id": reference_id,
            "payload": payload,
            "idem_key": idem_key,
        })
        db.commit()
        row = result.fetchone()
        if row:
            logger.info(f"📨 Queued {channel} [{event_type}] → {phone} (id={row[0]})")
            return row[0]
        else:
            logger.info(f"⏩ Duplicate skipped: {idem_key}")
            return None
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to queue message: {e}")
        return None


# =========================================================================
# STAFF NOTIFICATIONS (INTERNAL — via staff_notifications table)
# =========================================================================

def queue_staff_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    module: str = None,
    entity_type: str = None,
    entity_id: int = None,
    priority: str = "NORMAL",
    action_url: str = None,
) -> Optional[int]:
    """
    Insert into staff_notifications.
    Immediately visible in bell-icon poll.
    """
    try:
        result = db.execute(text("""
            INSERT INTO staff_notifications
                (user_id, title, message, module, entity_type, entity_id,
                 priority, is_read, action_url, created_at)
            VALUES
                (:uid, :title, :msg, :module, :etype, :eid,
                 :priority, FALSE, :url, NOW())
            RETURNING id
        """), {
            "uid": user_id,
            "title": title,
            "msg": message,
            "module": module,
            "etype": entity_type,
            "eid": entity_id,
            "priority": priority,
            "url": action_url,
        })
        db.commit()
        row = result.fetchone()
        nid = row[0] if row else None
        logger.info(f"🔔 Staff notification → user {user_id}: {title} (id={nid})")
        return nid
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to create staff notification: {e}")
        return None


def notify_role(
    db: Session,
    role: str,
    title: str,
    message: str,
    module: str = None,
    entity_type: str = None,
    entity_id: int = None,
    priority: str = "NORMAL",
    action_url: str = None,
) -> List[int]:
    """
    Send a staff notification to ALL active users with the given role.
    Returns list of notification ids.
    """
    try:
        users = db.execute(text("""
            SELECT id FROM users WHERE role = :role AND is_active = TRUE
        """), {"role": role}).fetchall()
    except Exception as e:
        logger.error(f"Failed to fetch users with role {role}: {e}")
        return []

    ids = []
    for (uid,) in users:
        nid = queue_staff_notification(
            db=db, user_id=uid, title=title, message=message,
            module=module, entity_type=entity_type, entity_id=entity_id,
            priority=priority, action_url=action_url,
        )
        if nid:
            ids.append(nid)
    return ids


def notify_roles(
    db: Session,
    roles: List[str],
    title: str,
    message: str,
    module: str = None,
    entity_type: str = None,
    entity_id: int = None,
    priority: str = "NORMAL",
    action_url: str = None,
) -> List[int]:
    """
    Send to multiple roles at once.
    """
    ids = []
    for role in roles:
        ids.extend(notify_role(
            db=db, role=role, title=title, message=message,
            module=module, entity_type=entity_type, entity_id=entity_id,
            priority=priority, action_url=action_url,
        ))
    return ids
