"""
Unified Tracking Service — Production-Grade
=============================================
Single source of truth for:
  - Tracking Sessions (linked to attendance)
  - Live GPS (one row per user, UPSERT)
  - Visit Logs (atomic sequence, session-bound)
  - Route Summary (generated on session end)

Replaces: services/tracking.py, dual subsystem logic
"""

import math
import json
import logging
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, text
from sqlalchemy.exc import IntegrityError

from models import (
    TrackingSession, UnifiedLiveLocation, VisitLog, RouteSummary,
    Attendance, User, UserRole
)

logger = logging.getLogger(__name__)


# ============= CONSTANTS =============

MAX_GPS_UPDATES_PER_MINUTE = 6
MAX_VISITS_PER_HOUR = 10
VALID_TRACKING_ROLES = {"SALESMAN", "SERVICE_ENGINEER"}
ADMIN_ROLES = {"ADMIN", "RECEPTION", "MANAGER"}


# ============= HELPERS =============

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance between two GPS points in kilometers."""
    R = 6371  # Earth's radius in km
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def validate_coordinates(lat: float, lon: float) -> bool:
    """Reject obviously invalid GPS coordinates."""
    if lat == 0 and lon == 0:
        return False
    if not (-90 <= lat <= 90):
        return False
    if not (-180 <= lon <= 180):
        return False
    return True


def get_user_role_str(user) -> str:
    """Normalize user role to uppercase string."""
    if hasattr(user.role, 'value'):
        return user.role.value.upper()
    return str(user.role).upper()


# ============= SESSION MANAGEMENT =============

def create_tracking_session(
    db: Session,
    user: User,
    attendance_id: Optional[int] = None,
) -> TrackingSession:
    """
    Create a tracking session for the user today.
    Called automatically on attendance check-in for field staff.
    Enforces: one ACTIVE session per user per day.
    """
    today = date.today()
    role_str = get_user_role_str(user)

    # Check for existing session today
    existing = db.query(TrackingSession).filter(
        TrackingSession.user_id == user.id,
        TrackingSession.session_date == today,
    ).first()

    if existing:
        if existing.status == "ACTIVE":
            logger.info(f"Session already active for user {user.id} on {today}")
            return existing
        else:
            # Session was ended today — don't create another
            logger.warning(f"Session already ended for user {user.id} on {today}")
            raise ValueError("Tracking session already ended for today")

    session = TrackingSession(
        user_id=user.id,
        attendance_id=attendance_id,
        role=role_str,
        check_in_time=datetime.utcnow(),
        status="ACTIVE",
        session_date=today,
    )
    db.add(session)
    db.flush()  # Get session.id without committing

    # Initialize live location row (UPSERT)
    _upsert_live_location(db, user.id, session.id, 0, 0, 0, is_active=False)

    logger.info(f"Tracking session created: user={user.id}, session={session.id}")
    return session


def get_active_session(db: Session, user_id: int) -> Optional[TrackingSession]:
    """Get the current ACTIVE session for a user (today only)."""
    today = date.today()
    return db.query(TrackingSession).filter(
        TrackingSession.user_id == user_id,
        TrackingSession.session_date == today,
        TrackingSession.status == "ACTIVE",
    ).first()


def end_tracking_session(
    db: Session,
    session: TrackingSession,
    auto_stopped: bool = False,
) -> RouteSummary:
    """
    End a tracking session:
    1. Mark session ENDED
    2. Deactivate live location
    3. Generate route summary from visit_logs
    """
    session.status = "ENDED"
    session.check_out_time = datetime.utcnow()
    session.auto_stopped = auto_stopped
    session.updated_at = datetime.utcnow()

    # Deactivate live location
    db.query(UnifiedLiveLocation).filter(
        UnifiedLiveLocation.user_id == session.user_id
    ).update({
        "is_active": False,
        "last_updated": datetime.utcnow(),
    })

    # Generate route summary
    route = _generate_route_summary(db, session)

    logger.info(
        f"Session ended: user={session.user_id}, session={session.id}, "
        f"auto_stopped={auto_stopped}, visits={route.total_visits}, "
        f"distance={route.total_distance_km:.2f}km"
    )
    return route


def close_stale_sessions(db: Session) -> int:
    """
    Find and close all ACTIVE sessions from before today.
    Called on server startup and by the scheduler.
    Returns count of sessions closed.
    """
    today = date.today()
    stale_sessions = db.query(TrackingSession).filter(
        TrackingSession.status == "ACTIVE",
        TrackingSession.session_date < today,
    ).all()

    count = 0
    for session in stale_sessions:
        try:
            end_tracking_session(db, session, auto_stopped=True)
            count += 1
        except Exception as e:
            logger.error(f"Failed to close stale session {session.id}: {e}")

    if count > 0:
        db.commit()
        logger.warning(f"Closed {count} stale tracking sessions from before {today}")

    return count


def auto_stop_all_sessions(db: Session) -> int:
    """
    End all ACTIVE sessions (6:30 PM auto-stop).
    Returns count of sessions ended.
    """
    active_sessions = db.query(TrackingSession).filter(
        TrackingSession.status == "ACTIVE",
    ).all()

    count = 0
    for session in active_sessions:
        try:
            end_tracking_session(db, session, auto_stopped=True)
            count += 1
        except Exception as e:
            logger.error(f"Failed to auto-stop session {session.id}: {e}")

    if count > 0:
        db.commit()
        logger.info(f"Auto-stopped {count} tracking sessions at 6:30 PM")

    return count


# ============= LIVE GPS =============

def update_live_location(
    db: Session,
    user_id: int,
    session_id: int,
    latitude: float,
    longitude: float,
    accuracy: float = 0,
) -> bool:
    """
    Upsert live location for a user.
    Requires active session — caller must validate.
    """
    if not validate_coordinates(latitude, longitude):
        raise ValueError(f"Invalid coordinates: lat={latitude}, lon={longitude}")

    _upsert_live_location(db, user_id, session_id, latitude, longitude, accuracy, is_active=True)
    return True


def get_all_live_locations(db: Session) -> List[Dict[str, Any]]:
    """Get all active live locations for admin map (JOIN with user info)."""
    result = db.execute(text("""
        SELECT
            ll.user_id,
            u.full_name,
            u.username,
            u.photograph,
            u.phone,
            u.email,
            ll.latitude,
            ll.longitude,
            ll.accuracy,
            ll.last_updated,
            ll.is_active,
            ll.session_id,
            ts.check_in_time,
            ts.session_date
        FROM unified_live_locations ll
        JOIN users u ON ll.user_id = u.id
        LEFT JOIN tracking_sessions ts ON ll.session_id = ts.id
        WHERE ll.is_active = true
        ORDER BY ll.last_updated DESC
    """))

    locations = []
    for row in result:
        locations.append({
            "user_id": row[0],
            "salesman_id": row[0],
            "full_name": row[1],
            "username": row[2],
            "photo_url": row[3],
            "phone": row[4],
            "email": row[5],
            "latitude": row[6],
            "longitude": row[7],
            "accuracy": row[8],
            "accuracy_m": row[8],
            "last_updated": row[9].isoformat() if row[9] else None,
            "updated_at": row[9].isoformat() if row[9] else None,
            "is_active": row[10],
            "session_id": row[11],
            "check_in_time": row[12].isoformat() if row[12] else None,
            "session_date": row[13].isoformat() if row[13] else None,
        })

    return locations


def _upsert_live_location(
    db: Session,
    user_id: int,
    session_id: int,
    lat: float,
    lon: float,
    accuracy: float,
    is_active: bool = True,
):
    """Internal: insert or update live location row."""
    existing = db.query(UnifiedLiveLocation).filter(
        UnifiedLiveLocation.user_id == user_id
    ).first()

    now = datetime.utcnow()
    if existing:
        existing.session_id = session_id
        existing.latitude = lat
        existing.longitude = lon
        existing.accuracy = accuracy
        existing.is_active = is_active
        existing.last_updated = now
    else:
        loc = UnifiedLiveLocation(
            user_id=user_id,
            session_id=session_id,
            latitude=lat,
            longitude=lon,
            accuracy=accuracy,
            is_active=is_active,
            last_updated=now,
        )
        db.add(loc)
    db.flush()


# ============= VISIT MANAGEMENT =============

def create_visit(
    db: Session,
    session: TrackingSession,
    user_id: int,
    latitude: float,
    longitude: float,
    customer_name: str = "",
    notes: str = "",
    accuracy: float = 0,
    visit_type: str = "customer_visit",
    address: str = "",
) -> VisitLog:
    """
    Create a visit within an active session.
    sequence_no is atomically derived via SELECT ... FOR UPDATE.
    """
    if not validate_coordinates(latitude, longitude):
        raise ValueError(f"Invalid coordinates: lat={latitude}, lon={longitude}")

    # Trim and validate inputs
    customer_name = (customer_name or "").strip()[:255]
    notes = (notes or "").strip()[:2000]
    address = (address or "").strip()[:500]

    # Atomic sequence: lock the SESSION row to prevent concurrent inserts,
    # then derive next sequence_no safely.
    db.execute(
        text("SELECT id FROM tracking_sessions WHERE id = :sid FOR UPDATE"),
        {"sid": session.id}
    )
    max_seq_result = db.execute(
        text("""
            SELECT COALESCE(MAX(sequence_no), 0)
            FROM visit_logs
            WHERE session_id = :session_id
        """),
        {"session_id": session.id}
    )
    next_seq = max_seq_result.scalar() + 1

    # Calculate distance from previous visit
    distance_km = 0.0
    if next_seq > 1:
        prev = db.query(VisitLog).filter(
            VisitLog.session_id == session.id,
            VisitLog.sequence_no == next_seq - 1,
        ).first()
        if prev:
            distance_km = haversine_distance(prev.latitude, prev.longitude, latitude, longitude)

    visit = VisitLog(
        session_id=session.id,
        user_id=user_id,
        sequence_no=next_seq,
        customer_name=customer_name,
        notes=notes,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        address=address if address else f"{latitude:.6f}, {longitude:.6f}",
        visit_type=visit_type,
        start_time=datetime.utcnow(),
        distance_from_prev_km=round(distance_km, 2),
    )
    db.add(visit)
    db.flush()

    logger.info(f"Visit #{next_seq} created: session={session.id}, user={user_id}")
    return visit


def complete_visit(db: Session, visit: VisitLog, latitude: float = None, longitude: float = None) -> VisitLog:
    """Mark a visit as completed with end time and optional end coordinates."""
    visit.end_time = datetime.utcnow()
    if latitude is not None and longitude is not None:
        if validate_coordinates(latitude, longitude):
            visit.end_latitude = latitude
            visit.end_longitude = longitude
    db.flush()
    return visit


def get_session_visits(db: Session, session_id: int) -> List[Dict[str, Any]]:
    """Get all visits for a session, ordered by sequence."""
    visits = db.query(VisitLog).filter(
        VisitLog.session_id == session_id
    ).order_by(VisitLog.sequence_no).all()

    return [
        {
            "id": v.id,
            "sequence": v.sequence_no,
            "customer_name": v.customer_name,
            "notes": v.notes,
            "lat": v.latitude,
            "lng": v.longitude,
            "accuracy": v.accuracy,
            "address": v.address,
            "visit_type": v.visit_type,
            "distance_km": v.distance_from_prev_km,
            "time": v.start_time.strftime("%I:%M %p") if v.start_time else None,
            "visited_at": v.start_time.isoformat() if v.start_time else None,
            "end_time": v.end_time.isoformat() if v.end_time else None,
            "status": "completed" if v.end_time else "active",
        }
        for v in visits
    ]


def get_active_visit(db: Session, session_id: int) -> Optional[VisitLog]:
    """Get the current uncompleted visit within a session."""
    return db.query(VisitLog).filter(
        VisitLog.session_id == session_id,
        VisitLog.end_time.is_(None),
    ).order_by(VisitLog.sequence_no.desc()).first()


# ============= ROUTE GENERATION =============

def _generate_route_summary(db: Session, session: TrackingSession) -> RouteSummary:
    """
    Build route summary from visit_logs within the session.
    Called once on session end.
    """
    visits = db.query(VisitLog).filter(
        VisitLog.session_id == session.id
    ).order_by(VisitLog.sequence_no).all()

    total_distance = sum(v.distance_from_prev_km or 0 for v in visits)
    polyline = [[v.latitude, v.longitude] for v in visits]
    start_time = visits[0].start_time if visits else session.check_in_time
    end_time = visits[-1].end_time or visits[-1].start_time if visits else session.check_out_time

    # Upsert route summary
    existing_route = db.query(RouteSummary).filter(
        RouteSummary.session_id == session.id
    ).first()

    if existing_route:
        existing_route.total_distance_km = round(total_distance, 2)
        existing_route.total_visits = len(visits)
        existing_route.start_time = start_time
        existing_route.end_time = end_time
        existing_route.polyline = json.dumps(polyline)
        existing_route.generated_at = datetime.utcnow()
        route = existing_route
    else:
        route = RouteSummary(
            session_id=session.id,
            user_id=session.user_id,
            total_distance_km=round(total_distance, 2),
            total_visits=len(visits),
            start_time=start_time,
            end_time=end_time,
            polyline=json.dumps(polyline),
        )
        db.add(route)

    db.flush()
    return route


def get_route_for_session(db: Session, session_id: int) -> Optional[Dict]:
    """Get route summary for a session."""
    route = db.query(RouteSummary).filter(
        RouteSummary.session_id == session_id
    ).first()

    if not route:
        return None

    return {
        "session_id": route.session_id,
        "total_distance_km": route.total_distance_km,
        "total_visits": route.total_visits,
        "start_time": route.start_time.strftime("%I:%M %p") if route.start_time else None,
        "end_time": route.end_time.strftime("%I:%M %p") if route.end_time else None,
        "polyline": json.loads(route.polyline) if route.polyline else [],
        "generated_at": route.generated_at.isoformat() if route.generated_at else None,
    }


def get_user_route_for_date(
    db: Session, user_id: int, query_date: date
) -> Optional[Dict]:
    """
    Get full route data for admin view: salesman info + visits + summary.
    Builds fresh from visit_logs if route_summary doesn't exist yet (active session).
    """
    session = db.query(TrackingSession).filter(
        TrackingSession.user_id == user_id,
        TrackingSession.session_date == query_date,
    ).first()

    if not session:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    visits = get_session_visits(db, session.id)

    # Try stored route summary first
    route_data = get_route_for_session(db, session.id)

    if route_data:
        summary = route_data
    else:
        # Compute live for active session
        total_distance = sum(v["distance_km"] or 0 for v in visits)
        summary = {
            "total_distance_km": round(total_distance, 2),
            "total_visits": len(visits),
            "start_time": visits[0]["time"] if visits else None,
            "end_time": visits[-1]["time"] if visits else None,
        }

    return {
        "salesman": {
            "id": user.id,
            "name": user.full_name,
            "username": user.username,
            "photo_url": user.photograph,
            "phone": user.phone,
            "email": user.email,
        } if user else None,
        "date": query_date.isoformat(),
        "session_status": session.status,
        "summary": summary,
        "visits": visits,
        "route_path": [[v["lat"], v["lng"]] for v in visits],
    }
