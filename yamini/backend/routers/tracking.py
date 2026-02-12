from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import get_current_user
from datetime import datetime
from services.tracking import save_location, get_live_locations, deactivate_user_location
import asyncio


router = APIRouter(prefix="/api/tracking", tags=["tracking"])


@router.post("/visits/check-in")
async def checkin_visit(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Salesman check-in to start a customer visit with GPS tracking"""
    if current_user.role not in ["SALESMAN", "salesman"]:
        raise HTTPException(status_code=403, detail="Salesmen only")
    
    try:
        # Create visit record in salesman_visits table
        now = datetime.utcnow()
        result = db.execute(text("""
            INSERT INTO salesman_visits 
            (user_id, customer_name, visit_title, notes, check_in_time, check_in_latitude, check_in_longitude, created_at, updated_at)
            VALUES (:user_id, :customer_name, :visit_title, :notes, :check_in_time, :latitude, :longitude, :created_at, :updated_at)
            RETURNING id
        """), {
            "user_id": current_user.id,
            "customer_name": request.get("customername", ""),
            "visit_title": request.get("customername", "Visit"),
            "notes": request.get("notes", ""),
            "check_in_time": now,
            "latitude": request.get("latitude", 0),
            "longitude": request.get("longitude", 0),
            "created_at": now,
            "updated_at": now
        })
        
        visit_id = result.fetchone()[0]
        
        # Initialize live location tracking (in same transaction)
        await save_location(
            db, 
            current_user.id, 
            request.get("latitude", 0), 
            request.get("longitude", 0),
            request.get("accuracy", 0)
        )
        
        # Commit both operations together
        db.commit()
        
        return {
            "visit_id": visit_id,
            "status": "tracking_started",
            "message": "Visit started - GPS tracking active"
        }
        
    except Exception as e:
        print(f"❌ Check-in error: {str(e)}")  # Print to console for debugging
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Check-in failed: {str(e)}")


@router.post("/visits/check-out")
async def checkout_visit(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Salesman check-out to complete a visit"""
    visit_id = request.get("visit_id")
    
    if not visit_id:
        raise HTTPException(status_code=400, detail="visit_id required")
    
    try:
        # Verify visit belongs to current user
        result = db.execute(text("""
            SELECT id FROM salesman_visits 
            WHERE id = :visit_id AND user_id = :user_id AND check_out_time IS NULL
        """), {"visit_id": visit_id, "user_id": current_user.id})
        
        visit = result.fetchone()
        if not visit:
            raise HTTPException(status_code=404, detail="Active visit not found")
        
        # Update visit with checkout data
        db.execute(text("""
            UPDATE salesman_visits 
            SET check_out_time = :check_out_time,
                check_out_latitude = :latitude,
                check_out_longitude = :longitude
            WHERE id = :visit_id
        """), {
            "visit_id": visit_id,
            "check_out_time": datetime.utcnow(),
            "latitude": request.get("latitude", 0),
            "longitude": request.get("longitude", 0)
        })
        
        # Deactivate live tracking (in same transaction)
        await deactivate_user_location(db, current_user.id)
        
        # Commit both operations together
        db.commit()
        
        return {
            "status": "visit_completed",
            "message": "Visit completed - GPS tracking stopped"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Check-out failed: {str(e)}")


@router.post("/location/update")
async def update_location(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update live GPS location during active visit"""
    try:
        await save_location(
            db,
            current_user.id,
            request.get("latitude", 0),
            request.get("longitude", 0),
            request.get("accuracy", 0)
        )
        
        return {"status": "location_updated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location update failed: {str(e)}")


@router.get("/live/locations")
async def live_locations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active live locations for admin dashboard map"""
    if current_user.role not in ["ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        locations = await get_live_locations(db)
        return {
            "active_count": len(locations),
            "locations": locations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get locations: {str(e)}")


@router.get("/visits/active")
async def get_active_visit(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current active visit for logged-in salesman"""
    try:
        result = db.execute(text("""
            SELECT id, customer_name, notes, check_in_time, 
                   check_in_latitude, check_in_longitude
            FROM salesman_visits
            WHERE user_id = :user_id AND check_out_time IS NULL
            ORDER BY check_in_time DESC
            LIMIT 1
        """), {"user_id": current_user.id})
        
        visit = result.fetchone()
        
        if visit:
            return {
                "status": "active_visit",
                "visit_id": visit[0],
                "customername": visit[1],
                "notes": visit[2],
                "checkintime": visit[3].isoformat() if visit[3] else None,
                "latitude": visit[4],
                "longitude": visit[5]
            }
        else:
            return {"status": "no_active_visit"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active visit: {str(e)}")


@router.get("/visits/today")
async def get_all_visits_today(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all visits today for route tracking (admin only)"""
    try:
        # Check role (case-insensitive)
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        if user_role.lower() not in ['admin', 'super_admin', 'manager']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        result = db.execute(text("""
            SELECT sv.id, sv.user_id, u.full_name, u.photograph, sv.customer_name, sv.notes,
                   sv.check_in_time, sv.check_out_time,
                   sv.check_in_latitude, sv.check_in_longitude,
                   sv.check_out_latitude, sv.check_out_longitude
            FROM salesman_visits sv
            JOIN users u ON sv.user_id = u.id
            WHERE DATE(sv.check_in_time) = CURRENT_DATE
            ORDER BY sv.user_id, sv.check_in_time
        """))
        
        visits = []
        for row in result:
            visits.append({
                "id": row[0],
                "user_id": row[1],
                "full_name": row[2],
                "photo_url": row[3],
                "customer_name": row[4],
                "notes": row[5],
                "check_in_time": row[6].isoformat() if row[6] else None,
                "check_out_time": row[7].isoformat() if row[7] else None,
                "check_in_latitude": row[8],
                "check_in_longitude": row[9],
                "check_out_latitude": row[10],
                "check_out_longitude": row[11],
                "status": "completed" if row[7] else "active"
            })
        
        return {"visits": visits}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get today's visits: {str(e)}")


@router.get("/visits/history")
async def get_visit_history(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get visit history for salesman"""
    try:
        result = db.execute(text("""
            SELECT id, customer_name, notes, check_in_time, check_out_time,
                   check_in_latitude, check_in_longitude,
                   check_out_latitude, check_out_longitude
            FROM salesman_visits
            WHERE user_id = :user_id
            ORDER BY check_in_time DESC
            LIMIT :limit
        """), {"user_id": current_user.id, "limit": limit})
        
        visits = []
        for row in result:
            visits.append({
                "id": row[0],
                "customername": row[1],
                "notes": row[2],
                "checkintime": row[3].isoformat() if row[3] else None,
                "checkouttime": row[4].isoformat() if row[4] else None,
                "checkin_latitude": row[5],
                "checkin_longitude": row[6],
                "checkout_latitude": row[7],
                "checkout_longitude": row[8],
                "status": "completed" if row[4] else "active"
            })
        
        return {"visits": visits}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")


# ============= GEOFENCING ENDPOINTS =============

@router.get("/geofences")
async def get_geofences(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all geofences for the user"""
    try:
        result = db.execute(text("""
            SELECT id, name, type, latitude, longitude, radius, allow_attendance, is_active
            FROM geofences
            WHERE is_active = true
        """))
        
        geofences = []
        for row in result:
            geofences.append({
                "id": row[0],
                "name": row[1],
                "type": row[2],
                "latitude": float(row[3]),
                "longitude": float(row[4]),
                "radius": row[5],
                "allow_attendance": row[6],
                "is_active": row[7]
            })
        
        return {"geofences": geofences}
        
    except Exception as e:
        # Return default office geofence if table doesn't exist
        return {"geofences": [
            {
                "id": "default_office",
                "name": "Office",
                "type": "office",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "radius": 100,
                "allow_attendance": True,
                "is_active": True
            }
        ]}


@router.post("/geofences")
async def create_geofence(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new geofence (Admin only)"""
    if current_user.role.lower() not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        # Create geofences table if not exists
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS geofences (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) DEFAULT 'office',
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                radius INTEGER DEFAULT 100,
                allow_attendance BOOLEAN DEFAULT true,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER
            )
        """))
        
        result = db.execute(text("""
            INSERT INTO geofences (name, type, latitude, longitude, radius, allow_attendance, created_by)
            VALUES (:name, :type, :latitude, :longitude, :radius, :allow_attendance, :created_by)
            RETURNING id
        """), {
            "name": request.get("name"),
            "type": request.get("type", "office"),
            "latitude": request.get("latitude"),
            "longitude": request.get("longitude"),
            "radius": request.get("radius", 100),
            "allow_attendance": request.get("allow_attendance", True),
            "created_by": current_user.id
        })
        
        db.commit()
        return {"id": result.fetchone()[0], "message": "Geofence created"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create geofence: {str(e)}")


@router.post("/geofence-event")
async def log_geofence_event(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log geofence enter/exit events"""
    try:
        # Create events table if not exists
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS geofence_events (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                geofence_id VARCHAR(50),
                geofence_name VARCHAR(100),
                geofence_type VARCHAR(50),
                event_type VARCHAR(20) NOT NULL,
                event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        db.execute(text("""
            INSERT INTO geofence_events (user_id, geofence_id, geofence_name, geofence_type, event_type, event_time)
            VALUES (:user_id, :geofence_id, :geofence_name, :geofence_type, :event_type, :event_time)
        """), {
            "user_id": current_user.id,
            "geofence_id": request.get("geofence_id"),
            "geofence_name": request.get("geofence_name"),
            "geofence_type": request.get("geofence_type"),
            "event_type": request.get("event_type"),
            "event_time": datetime.fromisoformat(request.get("timestamp").replace('Z', '+00:00')) if request.get("timestamp") else datetime.utcnow()
        })
        
        db.commit()
        return {"status": "logged"}
        
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


# ============= DEVICE STATUS MONITORING =============

@router.post("/device-status")
async def log_device_status(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log device status updates and alerts"""
    try:
        # Create device status table if not exists
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS device_status_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                alert_type VARCHAR(50),
                message TEXT,
                battery_level INTEGER,
                battery_charging BOOLEAN,
                gps_enabled BOOLEAN,
                gps_accuracy FLOAT,
                is_online BOOLEAN,
                network_type VARCHAR(20),
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        db.execute(text("""
            INSERT INTO device_status_logs 
            (user_id, alert_type, message, battery_level, battery_charging, gps_enabled, gps_accuracy, is_online, network_type, logged_at)
            VALUES (:user_id, :alert_type, :message, :battery_level, :battery_charging, :gps_enabled, :gps_accuracy, :is_online, :network_type, :logged_at)
        """), {
            "user_id": current_user.id,
            "alert_type": request.get("alert_type"),
            "message": request.get("message"),
            "battery_level": request.get("battery_level"),
            "battery_charging": request.get("battery_charging"),
            "gps_enabled": request.get("gps_enabled"),
            "gps_accuracy": request.get("gps_accuracy"),
            "is_online": request.get("is_online"),
            "network_type": request.get("network_type"),
            "logged_at": datetime.fromisoformat(request.get("timestamp").replace('Z', '+00:00')) if request.get("timestamp") else datetime.utcnow()
        })
        
        db.commit()
        
        # Send notification for critical alerts
        alert_type = request.get("alert_type")
        if alert_type in ['battery_low', 'gps_disabled', 'offline']:
            # TODO: Send push notification to admin
            pass
        
        return {"status": "logged"}
        
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


@router.get("/device-status/alerts")
async def get_device_alerts(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent device alerts for admin (Admin only)"""
    user_role = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if user_role.lower() not in ['admin', 'super_admin', 'manager']:
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        result = db.execute(text("""
            SELECT d.id, d.user_id, u.full_name, u.username, d.alert_type, d.message, 
                   d.battery_level, d.gps_enabled, d.is_online, d.logged_at
            FROM device_status_logs d
            JOIN users u ON d.user_id = u.id
            WHERE d.alert_type != 'status_update'
            ORDER BY d.logged_at DESC
            LIMIT 50
        """))
        
        alerts = []
        for row in result:
            alerts.append({
                "id": row[0],
                "user_id": row[1],
                "full_name": row[2],
                "username": row[3],
                "alert_type": row[4],
                "message": row[5],
                "battery_level": row[6],
                "gps_enabled": row[7],
                "is_online": row[8],
                "logged_at": row[9].isoformat() if row[9] else None
            })
        
        return {"alerts": alerts}
        
    except Exception as e:
        return {"alerts": [], "error": str(e)}

