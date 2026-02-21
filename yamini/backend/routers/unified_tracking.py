"""
Unified Tracking Router — Production-Grade
============================================
Single API surface for:
  - Session lifecycle (auto from attendance, manual stop)
  - Live GPS updates (session-validated, rate-limited)
  - Visit CRUD (session-bound, atomic sequence)
  - Route retrieval (admin, session-based)
  - Admin live map (live locations + routes)

Replaces: routers/tracking.py, routers/salesman_tracking.py
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, date
import logging
import time
import pytz

from database import get_db
from auth import get_current_user
import models
from services.unified_tracking import (
    get_user_role_str,
    VALID_TRACKING_ROLES,
    ADMIN_ROLES,
    create_tracking_session,
    get_active_session,
    end_tracking_session,
    update_live_location,
    get_all_live_locations,
    create_visit,
    complete_visit,
    get_active_visit,
    get_session_visits,
    get_user_route_for_date,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/unified-tracking", tags=["unified-tracking"])


# ============= SCHEMAS =============

class GPSUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: float = 0

    @field_validator("latitude")
    @classmethod
    def validate_lat(cls, v):
        if not (-90 <= v <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_lon(cls, v):
        if not (-180 <= v <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v


class VisitCheckInRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: float = 0
    customer_name: str = Field("", max_length=255)
    notes: str = Field("", max_length=2000)
    visit_type: str = Field("customer_visit", max_length=50)

    @field_validator("latitude")
    @classmethod
    def validate_lat(cls, v):
        if not (-90 <= v <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_lon(cls, v):
        if not (-180 <= v <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator("customer_name")
    @classmethod
    def strip_customer_name(cls, v):
        return (v or "").strip()


class VisitCheckOutRequest(BaseModel):
    visit_id: int
    latitude: float = 0
    longitude: float = 0
    accuracy: float = 0


class StopSessionRequest(BaseModel):
    latitude: float = 0
    longitude: float = 0


# ============= RATE LIMITER (Simple per-user in-memory) =============
# Production: use Redis-backed slowapi. This is a minimal guard.

_gps_timestamps: dict = {}  # user_id -> [timestamps]
_visit_timestamps: dict = {}


def _check_gps_rate(user_id: int):
    """Max 6 GPS updates per minute per user."""
    now = time.time()
    window = 60
    max_count = 6
    key = user_id

    times = _gps_timestamps.get(key, [])
    times = [t for t in times if now - t < window]
    if len(times) >= max_count:
        raise HTTPException(status_code=429, detail="GPS update rate limit exceeded (max 6/min)")
    times.append(now)
    _gps_timestamps[key] = times


def _check_visit_rate(user_id: int):
    """Max 10 visits per hour per user."""
    now = time.time()
    window = 3600
    max_count = 10
    key = user_id

    times = _visit_timestamps.get(key, [])
    times = [t for t in times if now - t < window]
    if len(times) >= max_count:
        raise HTTPException(status_code=429, detail="Visit creation rate limit exceeded (max 10/hr)")
    times.append(now)
    _visit_timestamps[key] = times


# ============= HELPER =============

INDIA_TZ = pytz.timezone("Asia/Kolkata")
TRACKING_CUTOFF_HOUR = 23  # 11:00 PM IST - effectively no block during working hours


def _check_tracking_hours():
    """Soft check - only block very late night (11 PM+). Scheduler handles auto-stop at 6:30 PM."""
    now = datetime.now(INDIA_TZ)
    if now.hour >= TRACKING_CUTOFF_HOUR:
        raise HTTPException(
            status_code=403,
            detail=f"Tracking is disabled after {TRACKING_CUTOFF_HOUR}:00 IST. Current time: {now.strftime('%I:%M %p IST')}"
        )


def _require_field_role(user):
    """Ensure user is SALESMAN or SERVICE_ENGINEER."""
    role = get_user_role_str(user)
    if role not in VALID_TRACKING_ROLES:
        raise HTTPException(status_code=403, detail="Only field staff (SALESMAN, SERVICE_ENGINEER) can use tracking")


def _require_admin_role(user):
    """Ensure user is ADMIN, RECEPTION, or MANAGER."""
    role = get_user_role_str(user)
    if role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required")


def _require_active_session(db: Session, user_id: int) -> models.TrackingSession:
    """Get active session or raise 409."""
    session = get_active_session(db, user_id)
    if not session:
        raise HTTPException(
            status_code=409,
            detail="No active tracking session. Please check-in for attendance first."
        )
    return session


# ============= SESSION ENDPOINTS =============

@router.get("/session/status")
async def get_session_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check current tracking session status for logged-in field user."""
    session = get_active_session(db, current_user.id)
    if session:
        active_visit = get_active_visit(db, session.id)
        return {
            "status": "ACTIVE",
            "session_id": session.id,
            "check_in_time": session.check_in_time.isoformat() if session.check_in_time else None,
            "session_date": session.session_date.isoformat(),
            "active_visit": {
                "visit_id": active_visit.id,
                "customer_name": active_visit.customer_name,
                "sequence": active_visit.sequence_no,
            } if active_visit else None,
        }
    else:
        return {"status": "INACTIVE", "session_id": None}


@router.post("/session/start")
async def start_session_manually(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start a tracking session manually (for cases where auto-start from attendance 
    didn't happen or for re-activation).
    Normal flow: session is auto-created during attendance check-in.
    """
    _require_field_role(current_user)
    try:
        session = create_tracking_session(db, current_user)
        db.commit()
        return {
            "status": "ACTIVE",
            "session_id": session.id,
            "message": "Tracking session started",
        }
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        db.rollback()
        logger.error(f"Session start error: {e}")
        raise HTTPException(status_code=500, detail="Failed to start session")


@router.post("/session/stop")
async def stop_session(
    body: StopSessionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually end the current tracking session (e.g., end-of-day checkout)."""
    _require_field_role(current_user)
    session = _require_active_session(db, current_user.id)

    try:
        route = end_tracking_session(db, session, auto_stopped=False)
        db.commit()
        return {
            "status": "ENDED",
            "session_id": session.id,
            "route": {
                "total_distance_km": route.total_distance_km,
                "total_visits": route.total_visits,
            },
            "message": "Tracking session ended. Route generated.",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Session stop error: {e}")
        raise HTTPException(status_code=500, detail="Failed to stop session")


# ============= GPS ENDPOINTS =============

@router.post("/gps/update")
async def gps_update(
    body: GPSUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update live GPS position.
    REQUIRES: Active tracking session.
    Rate limited: max 6 per minute.
    """
    _require_field_role(current_user)
    _check_tracking_hours()
    _check_gps_rate(current_user.id)
    session = _require_active_session(db, current_user.id)

    try:
        update_live_location(
            db, current_user.id, session.id,
            body.latitude, body.longitude, body.accuracy,
        )
        db.commit()
        return {"status": "location_updated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        logger.error(f"GPS update error: {e}")
        raise HTTPException(status_code=500, detail="Location update failed")


# ============= VISIT ENDPOINTS =============

@router.post("/visits/check-in")
async def visit_check_in(
    body: VisitCheckInRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start a customer visit within the active session.
    REQUIRES: Active tracking session.
    Sequence number is auto-calculated atomically.
    """
    _require_field_role(current_user)
    _check_tracking_hours()
    _check_visit_rate(current_user.id)
    session = _require_active_session(db, current_user.id)

    if not body.customer_name.strip():
        raise HTTPException(status_code=400, detail="Customer name is required")

    try:
        visit = create_visit(
            db, session, current_user.id,
            latitude=body.latitude,
            longitude=body.longitude,
            customer_name=body.customer_name,
            notes=body.notes,
            accuracy=body.accuracy,
            visit_type=body.visit_type,
        )

        # Also update live location on visit check-in
        update_live_location(
            db, current_user.id, session.id,
            body.latitude, body.longitude, body.accuracy,
        )

        db.commit()
        return {
            "visit_id": visit.id,
            "sequence_no": visit.sequence_no,
            "distance_from_prev_km": visit.distance_from_prev_km,
            "status": "tracking_started",
            "message": f"Visit #{visit.sequence_no} started — GPS tracking active",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        logger.error(f"Visit check-in error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Check-in failed")


@router.post("/visits/check-out")
async def visit_check_out(
    body: VisitCheckOutRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete a customer visit."""
    _require_field_role(current_user)
    session = _require_active_session(db, current_user.id)

    visit = db.query(models.VisitLog).filter(
        models.VisitLog.id == body.visit_id,
        models.VisitLog.session_id == session.id,
        models.VisitLog.user_id == current_user.id,
        models.VisitLog.end_time.is_(None),
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Active visit not found")

    try:
        complete_visit(db, visit, body.latitude, body.longitude)

        # Also update live location on checkout
        if body.latitude and body.longitude:
            update_live_location(
                db, current_user.id, session.id,
                body.latitude, body.longitude, body.accuracy,
            )

        db.commit()
        return {
            "status": "visit_completed",
            "visit_id": visit.id,
            "message": "Visit completed",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Visit checkout error: {e}")
        raise HTTPException(status_code=500, detail="Check-out failed")


@router.get("/visits/active")
async def get_current_active_visit(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current active (uncompleted) visit for the logged-in user."""
    session = get_active_session(db, current_user.id)
    if not session:
        return {"status": "no_active_session"}

    visit = get_active_visit(db, session.id)
    if visit:
        return {
            "status": "active_visit",
            "visit_id": visit.id,
            "customername": visit.customer_name,
            "notes": visit.notes,
            "checkintime": visit.start_time.isoformat() if visit.start_time else None,
            "latitude": visit.latitude,
            "longitude": visit.longitude,
            "sequence": visit.sequence_no,
        }
    return {"status": "no_active_visit"}


@router.get("/visits/today")
async def get_my_visits_today(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's visits for today."""
    session = get_active_session(db, current_user.id)

    # Also check ended session for today
    if not session:
        session = db.query(models.TrackingSession).filter(
            models.TrackingSession.user_id == current_user.id,
            models.TrackingSession.session_date == date.today(),
        ).first()

    if not session:
        return {"date": date.today().isoformat(), "total_visits": 0, "visits": []}

    visits = get_session_visits(db, session.id)
    total_distance = sum(v["distance_km"] or 0 for v in visits)

    return {
        "date": date.today().isoformat(),
        "session_status": session.status,
        "total_visits": len(visits),
        "total_distance_km": round(total_distance, 2),
        "visits": visits,
    }


@router.get("/visits/history")
async def get_visit_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """Get recent visit history for the logged-in user."""
    visits = db.query(models.VisitLog).filter(
        models.VisitLog.user_id == current_user.id,
    ).order_by(models.VisitLog.start_time.desc()).limit(limit).all()

    return {
        "visits": [
            {
                "id": v.id,
                "customername": v.customer_name,
                "notes": v.notes,
                "checkintime": v.start_time.isoformat() if v.start_time else None,
                "checkouttime": v.end_time.isoformat() if v.end_time else None,
                "checkin_latitude": v.latitude,
                "checkin_longitude": v.longitude,
                "checkout_latitude": v.end_latitude,
                "checkout_longitude": v.end_longitude,
                "status": "completed" if v.end_time else "active",
            }
            for v in visits
        ]
    }


# ============= ADMIN ENDPOINTS =============

@router.get("/admin/live-locations")
async def admin_live_locations(
    role: Optional[str] = Query(None, description="Filter by role: SALESMAN, SERVICE_ENGINEER, or ALL"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all active live locations for the admin dashboard map.
    Optionally filter by role (SALESMAN, SERVICE_ENGINEER)."""
    _require_admin_role(current_user)

    locations = get_all_live_locations(db, role_filter=role)
    return {
        "active_count": len(locations),
        "locations": locations,
    }


@router.get("/admin/salesman/{salesman_id}/route")
async def admin_get_salesman_route(
    salesman_id: int,
    route_date: Optional[str] = Query(None, alias="date"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a salesman's route for a given date.
    Routes are built from visit_logs, with summary from route_summary if available.
    """
    _require_admin_role(current_user)

    if route_date:
        try:
            query_date = datetime.strptime(route_date, "%Y-%m-%d").date()
        except ValueError:
            query_date = date.today()
    else:
        query_date = date.today()

    result = get_user_route_for_date(db, salesman_id, query_date)

    if not result:
        raise HTTPException(status_code=404, detail="No tracking data found for this user/date")

    return result


@router.get("/admin/routes/today")
async def admin_all_routes_today(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get summary of all field staff routes for today."""
    _require_admin_role(current_user)

    sessions = db.query(models.TrackingSession).filter(
        models.TrackingSession.session_date == date.today(),
    ).all()

    routes = []
    for s in sessions:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        visits = db.query(models.VisitLog).filter(models.VisitLog.session_id == s.id).all()
        total_dist = sum(v.distance_from_prev_km or 0 for v in visits)
        start_time = visits[0].start_time if visits else s.check_in_time
        end_time = visits[-1].start_time if visits else None

        routes.append({
            "salesman_id": s.user_id,
            "name": user.full_name if user else "Unknown",
            "photo_url": user.photograph if user else None,
            "session_status": s.status,
            "visit_count": len(visits),
            "total_distance_km": round(total_dist, 2),
            "start_time": start_time.strftime("%I:%M %p") if start_time else None,
            "end_time": end_time.strftime("%I:%M %p") if end_time else None,
        })

    return {
        "date": date.today().isoformat(),
        "salesmen_with_routes": len(routes),
        "routes": routes,
    }


# ============= BACKWARD COMPATIBILITY — OLD API PATHS =============
# These map old URLs to the new unified system so frontend doesn't break
# during migration. Will be removed after frontend is updated.

compat_router = APIRouter(tags=["tracking-compat"])


@compat_router.post("/api/tracking/visits/check-in")
async def compat_visit_checkin(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible visit check-in (old API path)."""
    _require_field_role(current_user)

    # Auto-create session if needed (field staff may not yet have one)
    session = get_active_session(db, current_user.id)
    if not session:
        try:
            session = create_tracking_session(db, current_user)
        except ValueError:
            raise HTTPException(status_code=409, detail="Cannot start tracking session today")

    try:
        customer_name = (request.get("customername") or request.get("customer_name") or "").strip()
        if not customer_name:
            raise HTTPException(status_code=400, detail="Customer name is required")

        visit = create_visit(
            db, session, current_user.id,
            latitude=request.get("latitude", 0),
            longitude=request.get("longitude", 0),
            customer_name=customer_name,
            notes=request.get("notes", ""),
            accuracy=request.get("accuracy", 0),
        )

        update_live_location(
            db, current_user.id, session.id,
            request.get("latitude", 0),
            request.get("longitude", 0),
            request.get("accuracy", 0),
        )

        db.commit()
        return {
            "visit_id": visit.id,
            "status": "tracking_started",
            "message": "Visit started — GPS tracking active",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Compat visit check-in error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Check-in failed: {str(e)}")


@compat_router.post("/api/tracking/visits/check-out")
async def compat_visit_checkout(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible visit check-out."""
    visit_id = request.get("visit_id")
    if not visit_id:
        raise HTTPException(status_code=400, detail="visit_id required")

    session = _require_active_session(db, current_user.id)

    visit = db.query(models.VisitLog).filter(
        models.VisitLog.id == visit_id,
        models.VisitLog.session_id == session.id,
        models.VisitLog.user_id == current_user.id,
        models.VisitLog.end_time.is_(None),
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Active visit not found")

    try:
        complete_visit(db, visit, request.get("latitude"), request.get("longitude"))
        db.commit()
        return {"status": "visit_completed", "message": "Visit completed — GPS tracking stopped"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Check-out failed: {str(e)}")


@compat_router.post("/api/tracking/location/update")
async def compat_location_update(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible GPS location update."""
    _require_field_role(current_user)
    _check_gps_rate(current_user.id)

    session = get_active_session(db, current_user.id)
    if not session:
        # Silently ignore if no session (graceful degradation for old clients)
        return {"status": "no_active_session"}

    try:
        update_live_location(
            db, current_user.id, session.id,
            request.get("latitude", 0),
            request.get("longitude", 0),
            request.get("accuracy", 0),
        )
        db.commit()
        return {"status": "location_updated"}
    except ValueError:
        return {"status": "invalid_coordinates"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Location update failed: {str(e)}")


@compat_router.get("/api/tracking/live/locations")
async def compat_live_locations(
    role: Optional[str] = Query(None, description="Filter by role: SALESMAN, SERVICE_ENGINEER, or ALL"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible live locations for admin map."""
    _require_admin_role(current_user)
    locations = get_all_live_locations(db, role_filter=role)
    return {"active_count": len(locations), "locations": locations}


@compat_router.get("/api/tracking/visits/active")
async def compat_active_visit(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible active visit check."""
    session = get_active_session(db, current_user.id)
    if not session:
        return {"status": "no_active_visit"}

    visit = get_active_visit(db, session.id)
    if visit:
        return {
            "status": "active_visit",
            "visit_id": visit.id,
            "customername": visit.customer_name,
            "notes": visit.notes,
            "checkintime": visit.start_time.isoformat() if visit.start_time else None,
            "latitude": visit.latitude,
            "longitude": visit.longitude,
        }
    return {"status": "no_active_visit"}


@compat_router.get("/api/tracking/visits/today")
async def compat_all_visits_today(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible: get all visits today (admin only)."""
    role = get_user_role_str(current_user)
    if role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized")

    today = date.today()
    sessions = db.query(models.TrackingSession).filter(
        models.TrackingSession.session_date == today,
    ).all()

    visits = []
    for s in sessions:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        session_visits = db.query(models.VisitLog).filter(
            models.VisitLog.session_id == s.id
        ).order_by(models.VisitLog.sequence_no).all()

        for v in session_visits:
            visits.append({
                "id": v.id,
                "user_id": v.user_id,
                "full_name": user.full_name if user else None,
                "photo_url": user.photograph if user else None,
                "customer_name": v.customer_name,
                "notes": v.notes,
                "check_in_time": v.start_time.isoformat() if v.start_time else None,
                "check_out_time": v.end_time.isoformat() if v.end_time else None,
                "check_in_latitude": v.latitude,
                "check_in_longitude": v.longitude,
                "check_out_latitude": v.end_latitude,
                "check_out_longitude": v.end_longitude,
                "status": "completed" if v.end_time else "active",
            })

    return {"visits": visits}


@compat_router.get("/api/tracking/visits/history")
async def compat_visit_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """Backward-compatible visit history."""
    visits = db.query(models.VisitLog).filter(
        models.VisitLog.user_id == current_user.id,
    ).order_by(models.VisitLog.start_time.desc()).limit(limit).all()

    return {
        "visits": [
            {
                "id": v.id,
                "customername": v.customer_name,
                "notes": v.notes,
                "checkintime": v.start_time.isoformat() if v.start_time else None,
                "checkouttime": v.end_time.isoformat() if v.end_time else None,
                "checkin_latitude": v.latitude,
                "checkin_longitude": v.longitude,
                "checkout_latitude": v.end_latitude,
                "checkout_longitude": v.end_longitude,
                "status": "completed" if v.end_time else "active",
            }
            for v in visits
        ]
    }


# Backward-compatible admin route endpoints (old salesman_tracking paths)

@compat_router.get("/api/admin/salesmen/live")
async def compat_admin_live(
    role: Optional[str] = Query(None, description="Filter by role: SALESMAN, SERVICE_ENGINEER, or ALL"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible admin live locations."""
    _require_admin_role(current_user)
    locations = get_all_live_locations(db, role_filter=role)
    return {"active_count": len(locations), "locations": locations}


@compat_router.get("/api/admin/salesmen/{salesman_id}/route")
async def compat_admin_route(
    salesman_id: int,
    route_date: Optional[str] = Query(None, alias="date"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible admin route view."""
    _require_admin_role(current_user)

    if route_date:
        try:
            query_date = datetime.strptime(route_date, "%Y-%m-%d").date()
        except ValueError:
            query_date = date.today()
    else:
        query_date = date.today()

    result = get_user_route_for_date(db, salesman_id, query_date)
    if not result:
        # Return empty structure matching old API shape
        user = db.query(models.User).filter(models.User.id == salesman_id).first()
        return {
            "salesman": {
                "id": user.id if user else salesman_id,
                "name": user.full_name if user else "Unknown",
                "username": user.username if user else "",
                "photo_url": user.photograph if user else None,
                "phone": user.phone if user else None,
                "email": user.email if user else None,
            },
            "date": query_date.isoformat(),
            "summary": {"start_time": None, "end_time": None, "total_visits": 0, "total_distance_km": 0},
            "visits": [],
            "route_path": [],
        }

    return result


@compat_router.get("/api/admin/salesmen/routes/today")
async def compat_admin_routes_today(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible admin routes summary for today."""
    _require_admin_role(current_user)

    sessions = db.query(models.TrackingSession).filter(
        models.TrackingSession.session_date == date.today(),
    ).all()

    routes = []
    for s in sessions:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        visits = db.query(models.VisitLog).filter(models.VisitLog.session_id == s.id).all()
        total_dist = sum(v.distance_from_prev_km or 0 for v in visits)

        routes.append({
            "salesman_id": s.user_id,
            "name": user.full_name if user else "Unknown",
            "photo_url": user.photograph if user else None,
            "visit_count": len(visits),
            "total_distance_km": round(total_dist, 2),
            "start_time": visits[0].start_time.strftime("%I:%M %p") if visits else None,
            "end_time": visits[-1].start_time.strftime("%I:%M %p") if visits else None,
        })

    return {
        "date": date.today().isoformat(),
        "salesmen_with_routes": len(routes),
        "routes": routes,
    }


# Backward-compatible salesman visit save (old salesman_tracking path)

@compat_router.post("/api/salesman/visits")
async def compat_salesman_visit(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible salesman visit save."""
    _require_field_role(current_user)
    _check_visit_rate(current_user.id)

    session = get_active_session(db, current_user.id)
    if not session:
        try:
            session = create_tracking_session(db, current_user)
        except ValueError:
            raise HTTPException(status_code=409, detail="Cannot start tracking session today")

    try:
        visit = create_visit(
            db, session, current_user.id,
            latitude=request.get("latitude", 0),
            longitude=request.get("longitude", 0),
            customer_name=request.get("customer_name", ""),
            notes=request.get("notes", ""),
            accuracy=request.get("accuracy_m", 0),
            visit_type=request.get("visit_type", "manual"),
        )
        db.commit()
        return {
            "success": True,
            "visit_id": visit.id,
            "sequence_no": visit.sequence_no,
            "distance_from_prev_km": visit.distance_from_prev_km,
            "message": f"Visit #{visit.sequence_no} saved",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save visit: {str(e)}")


@compat_router.post("/api/salesman/location/update")
async def compat_salesman_location(
    request: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible salesman live location update."""
    _require_field_role(current_user)
    _check_gps_rate(current_user.id)

    session = get_active_session(db, current_user.id)
    if not session:
        return {"success": True, "message": "No active session"}

    try:
        update_live_location(
            db, current_user.id, session.id,
            request.get("latitude", 0),
            request.get("longitude", 0),
            request.get("accuracy_m", 0),
        )
        db.commit()
        return {"success": True, "message": "Location updated"}
    except ValueError:
        return {"success": False, "message": "Invalid coordinates"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@compat_router.post("/api/salesman/location/stop")
async def compat_salesman_location_stop(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible stop tracking."""
    db.query(models.UnifiedLiveLocation).filter(
        models.UnifiedLiveLocation.user_id == current_user.id
    ).update({"is_active": False, "last_updated": datetime.utcnow()})
    db.commit()
    return {"success": True, "message": "Tracking stopped"}


@compat_router.get("/api/salesman/visits/today")
async def compat_salesman_visits_today(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Backward-compatible salesman visits today."""
    session = db.query(models.TrackingSession).filter(
        models.TrackingSession.user_id == current_user.id,
        models.TrackingSession.session_date == date.today(),
    ).first()

    if not session:
        return {"date": date.today().isoformat(), "total_visits": 0, "total_distance_km": 0, "visits": []}

    visits = get_session_visits(db, session.id)
    total_distance = sum(v["distance_km"] or 0 for v in visits)

    return {
        "date": date.today().isoformat(),
        "total_visits": len(visits),
        "total_distance_km": round(total_distance, 2),
        "visits": visits,
    }
