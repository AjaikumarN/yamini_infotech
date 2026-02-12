"""
Geofencing & Device Monitoring Router
======================================
Handles geofence management, enter/exit events, and device status logging.
Extracted from old tracking.py — clean, standalone module.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from database import get_db
from auth import get_current_user
import models
from services.unified_tracking import get_user_role_str, ADMIN_ROLES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tracking", tags=["geofencing"])


# ============= GEOFENCING ENDPOINTS =============

@router.get("/geofences")
async def get_geofences(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active geofences."""
    geofences = db.query(models.Geofence).filter(
        models.Geofence.is_active == True
    ).all()

    if not geofences:
        # Default office geofence fallback
        return {"geofences": [{
            "id": "default_office",
            "name": "Office",
            "type": "office",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "radius": 100,
            "allow_attendance": True,
            "is_active": True,
        }]}

    return {
        "geofences": [
            {
                "id": g.id,
                "name": g.name,
                "type": g.type,
                "latitude": float(g.latitude),
                "longitude": float(g.longitude),
                "radius": g.radius,
                "allow_attendance": g.allow_attendance,
                "is_active": g.is_active,
            }
            for g in geofences
        ]
    }


@router.post("/geofences")
async def create_geofence(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new geofence (Admin only)."""
    role = get_user_role_str(current_user)
    if role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin only")

    geofence = models.Geofence(
        name=request.get("name"),
        type=request.get("type", "office"),
        latitude=request.get("latitude"),
        longitude=request.get("longitude"),
        radius=request.get("radius", 100),
        allow_attendance=request.get("allow_attendance", True),
        created_by=current_user.id,
    )
    db.add(geofence)
    db.commit()
    db.refresh(geofence)
    return {"id": geofence.id, "message": "Geofence created"}


@router.post("/geofence-event")
async def log_geofence_event(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log geofence enter/exit events."""
    try:
        event_time = datetime.utcnow()
        if request.get("timestamp"):
            try:
                event_time = datetime.fromisoformat(
                    request["timestamp"].replace("Z", "+00:00")
                )
            except (ValueError, AttributeError):
                pass

        event = models.GeofenceEvent(
            user_id=current_user.id,
            geofence_id=request.get("geofence_id"),
            geofence_name=request.get("geofence_name"),
            geofence_type=request.get("geofence_type"),
            event_type=request.get("event_type"),
            event_time=event_time,
        )
        db.add(event)
        db.commit()
        return {"status": "logged"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


# ============= DEVICE STATUS MONITORING =============

@router.post("/device-status")
async def log_device_status(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log device status updates and alerts."""
    try:
        logged_at = datetime.utcnow()
        if request.get("timestamp"):
            try:
                logged_at = datetime.fromisoformat(
                    request["timestamp"].replace("Z", "+00:00")
                )
            except (ValueError, AttributeError):
                pass

        log = models.DeviceStatusLog(
            user_id=current_user.id,
            alert_type=request.get("alert_type"),
            message=request.get("message"),
            battery_level=request.get("battery_level"),
            battery_charging=request.get("battery_charging"),
            gps_enabled=request.get("gps_enabled"),
            gps_accuracy=request.get("gps_accuracy"),
            is_online=request.get("is_online"),
            network_type=request.get("network_type"),
            logged_at=logged_at,
        )
        db.add(log)
        db.commit()
        return {"status": "logged"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


@router.get("/device-status/alerts")
async def get_device_alerts(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get recent device alerts (Admin only)."""
    role = get_user_role_str(current_user)
    if role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin only")

    alerts = db.query(models.DeviceStatusLog).filter(
        models.DeviceStatusLog.alert_type != "status_update"
    ).order_by(models.DeviceStatusLog.logged_at.desc()).limit(50).all()

    return {
        "alerts": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "alert_type": a.alert_type,
                "message": a.message,
                "battery_level": a.battery_level,
                "gps_enabled": a.gps_enabled,
                "is_online": a.is_online,
                "logged_at": a.logged_at.isoformat() if a.logged_at else None,
            }
            for a in alerts
        ]
    }
