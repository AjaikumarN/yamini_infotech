"""
Enterprise Salesman Tracking API
================================
Routes are based on SALESMAN VISIT HISTORY - NOT admin location, NOT live GPS alone.

Key Concepts:
- Live Location: Current GPS position (for marker only)
- Visit Point: Meaningful stop (customer/area)
- Route: Ordered visit points for a day

APIs:
- POST /api/salesman/visits - Save visit point
- GET /api/admin/salesmen/{id}/route - Get route from visit history
- GET /api/admin/salesmen/live - Get all live locations
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database import get_db
from auth import get_current_user
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
import math

router = APIRouter(tags=["salesman-tracking"])


# ============= SCHEMAS =============

class VisitPointCreate(BaseModel):
    latitude: float
    longitude: float
    accuracy_m: Optional[float] = 0
    visit_type: Optional[str] = "manual"  # attendance, manual, job_completion, customer_visit
    customer_name: Optional[str] = None
    notes: Optional[str] = None


class LiveLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy_m: Optional[float] = 0


# ============= HELPER FUNCTIONS =============

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS points in kilometers"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


async def resolve_address(lat: float, lon: float) -> str:
    """
    Reverse geocode coordinates to address.
    In production, use Google Maps, Nominatim, or similar service.
    For now, returns coordinates as fallback.
    """
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lon, "format": "json"},
                headers={"User-Agent": "YaminiInfotech-ERP/1.0"},
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("display_name", f"{lat:.6f}, {lon:.6f}")
    except Exception as e:
        print(f"Geocoding failed: {e}")
    
    return f"{lat:.6f}, {lon:.6f}"


def ensure_tables_exist(db: Session):
    """Create tracking tables if they don't exist"""
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS salesman_visit_logs (
            id SERIAL PRIMARY KEY,
            salesman_id INTEGER NOT NULL REFERENCES users(id),
            visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
            sequence_no INTEGER NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            accuracy_m DOUBLE PRECISION DEFAULT 0,
            address VARCHAR(500),
            visit_type VARCHAR(50) DEFAULT 'manual',
            customer_name VARCHAR(200),
            notes TEXT,
            distance_from_prev_km DOUBLE PRECISION DEFAULT 0,
            visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS salesman_live_locations (
            id SERIAL PRIMARY KEY,
            salesman_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            accuracy_m DOUBLE PRECISION DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    # Create indexes
    db.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_visit_logs_salesman_date 
        ON salesman_visit_logs(salesman_id, visit_date)
    """))
    
    db.commit()


# ============= SALESMAN APIs (for mobile app) =============

@router.post("/api/salesman/visits")
async def save_visit_point(
    visit: VisitPointCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save a visit point (salesman action).
    Backend calculates: sequence_no, distance_from_prev, address resolution.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role.upper() not in ['SALESMAN', 'SERVICE_ENGINEER', 'ADMIN']:
        raise HTTPException(status_code=403, detail="Only field staff can save visits")
    
    try:
        ensure_tables_exist(db)
        today = date.today()
        
        # Get previous visit to calculate sequence and distance
        result = db.execute(text("""
            SELECT sequence_no, latitude, longitude 
            FROM salesman_visit_logs 
            WHERE salesman_id = :salesman_id AND visit_date = :visit_date
            ORDER BY sequence_no DESC
            LIMIT 1
        """), {"salesman_id": current_user.id, "visit_date": today})
        
        prev_visit = result.fetchone()
        
        if prev_visit:
            next_sequence = prev_visit[0] + 1
            distance_km = haversine_distance(
                prev_visit[1], prev_visit[2],
                visit.latitude, visit.longitude
            )
        else:
            next_sequence = 1
            distance_km = 0
        
        # Resolve address (async but we'll do sync for simplicity)
        address = f"{visit.latitude:.6f}, {visit.longitude:.6f}"
        
        # Insert visit record
        result = db.execute(text("""
            INSERT INTO salesman_visit_logs 
            (salesman_id, visit_date, sequence_no, latitude, longitude, accuracy_m, 
             address, visit_type, customer_name, notes, distance_from_prev_km, visited_at)
            VALUES 
            (:salesman_id, :visit_date, :sequence_no, :latitude, :longitude, :accuracy_m,
             :address, :visit_type, :customer_name, :notes, :distance_km, :visited_at)
            RETURNING id
        """), {
            "salesman_id": current_user.id,
            "visit_date": today,
            "sequence_no": next_sequence,
            "latitude": visit.latitude,
            "longitude": visit.longitude,
            "accuracy_m": visit.accuracy_m,
            "address": address,
            "visit_type": visit.visit_type,
            "customer_name": visit.customer_name,
            "notes": visit.notes,
            "distance_km": round(distance_km, 2),
            "visited_at": datetime.utcnow()
        })
        
        visit_id = result.fetchone()[0]
        db.commit()
        
        return {
            "success": True,
            "visit_id": visit_id,
            "sequence_no": next_sequence,
            "distance_from_prev_km": round(distance_km, 2),
            "message": f"Visit #{next_sequence} saved"
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Save visit error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save visit: {str(e)}")


@router.post("/api/salesman/location/update")
async def update_live_location(
    location: LiveLocationUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update salesman's live GPS location (for admin map marker).
    This does NOT create a visit point - just updates current position.
    """
    try:
        ensure_tables_exist(db)
        
        # Upsert live location
        db.execute(text("""
            INSERT INTO salesman_live_locations (salesman_id, latitude, longitude, accuracy_m, is_active, updated_at)
            VALUES (:salesman_id, :latitude, :longitude, :accuracy_m, true, NOW())
            ON CONFLICT (salesman_id) 
            DO UPDATE SET 
                latitude = :latitude, 
                longitude = :longitude, 
                accuracy_m = :accuracy_m,
                is_active = true,
                updated_at = NOW()
        """), {
            "salesman_id": current_user.id,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "accuracy_m": location.accuracy_m
        })
        
        db.commit()
        return {"success": True, "message": "Location updated"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update location: {str(e)}")


@router.post("/api/salesman/location/stop")
async def stop_live_tracking(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stop live tracking (mark as inactive)"""
    try:
        db.execute(text("""
            UPDATE salesman_live_locations 
            SET is_active = false, updated_at = NOW()
            WHERE salesman_id = :salesman_id
        """), {"salesman_id": current_user.id})
        
        db.commit()
        return {"success": True, "message": "Tracking stopped"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/salesman/visits/today")
async def get_my_visits_today(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current salesman's visits for today"""
    try:
        ensure_tables_exist(db)
        
        result = db.execute(text("""
            SELECT id, sequence_no, latitude, longitude, accuracy_m, address,
                   visit_type, customer_name, notes, distance_from_prev_km, visited_at
            FROM salesman_visit_logs
            WHERE salesman_id = :salesman_id AND visit_date = :today
            ORDER BY sequence_no ASC
        """), {"salesman_id": current_user.id, "today": date.today()})
        
        visits = []
        total_distance = 0
        
        for row in result:
            total_distance += row[9] or 0
            visits.append({
                "id": row[0],
                "sequence": row[1],
                "lat": row[2],
                "lng": row[3],
                "accuracy_m": row[4],
                "address": row[5],
                "visit_type": row[6],
                "customer_name": row[7],
                "notes": row[8],
                "distance_km": row[9],
                "time": row[10].strftime("%I:%M %p") if row[10] else None,
                "visited_at": row[10].isoformat() if row[10] else None
            })
        
        return {
            "date": date.today().isoformat(),
            "total_visits": len(visits),
            "total_distance_km": round(total_distance, 2),
            "visits": visits
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= ADMIN APIs (for web dashboard & admin app) =============

@router.get("/api/admin/salesmen/live")
async def get_all_live_locations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all active salesmen live locations (for admin map markers).
    Admin is a VIEWER only - location does not affect routing.
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role.upper() not in ['ADMIN', 'RECEPTION', 'MANAGER']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        ensure_tables_exist(db)
        
        result = db.execute(text("""
            SELECT sl.salesman_id, u.full_name, u.username, u.photograph, u.phone, u.email,
                   sl.latitude, sl.longitude, sl.accuracy_m, sl.updated_at, sl.is_active
            FROM salesman_live_locations sl
            JOIN users u ON sl.salesman_id = u.id
            WHERE sl.is_active = true
            ORDER BY sl.updated_at DESC
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
                "accuracy_m": row[8],
                "updated_at": row[9].isoformat() if row[9] else None,
                "is_active": row[10]
            })
        
        return {
            "active_count": len(locations),
            "locations": locations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/salesmen/{salesman_id}/route")
async def get_salesman_route(
    salesman_id: int,
    route_date: Optional[str] = Query(None, alias="date"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get salesman route built from VISIT HISTORY (not live GPS).
    This is THE source of truth for route display.
    
    Response includes:
    - Salesman info
    - Summary (start/end time, total distance)
    - Ordered visit points with distances
    """
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role.upper() not in ['ADMIN', 'RECEPTION', 'MANAGER']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        ensure_tables_exist(db)
        
        # Parse date or use today
        if route_date:
            try:
                query_date = datetime.strptime(route_date, "%Y-%m-%d").date()
            except:
                query_date = date.today()
        else:
            query_date = date.today()
        
        # Get salesman info
        salesman_result = db.execute(text("""
            SELECT id, full_name, username, photograph, phone, email
            FROM users WHERE id = :salesman_id
        """), {"salesman_id": salesman_id})
        
        salesman = salesman_result.fetchone()
        if not salesman:
            raise HTTPException(status_code=404, detail="Salesman not found")
        
        # Get visits for the day (ordered by sequence)
        visits_result = db.execute(text("""
            SELECT id, sequence_no, latitude, longitude, accuracy_m, address,
                   visit_type, customer_name, notes, distance_from_prev_km, visited_at
            FROM salesman_visit_logs
            WHERE salesman_id = :salesman_id AND visit_date = :query_date
            ORDER BY sequence_no ASC
        """), {"salesman_id": salesman_id, "query_date": query_date})
        
        visits = []
        total_distance = 0
        start_time = None
        end_time = None
        
        for row in visits_result:
            visit_time = row[10]
            if visit_time:
                if not start_time or visit_time < start_time:
                    start_time = visit_time
                if not end_time or visit_time > end_time:
                    end_time = visit_time
            
            distance_km = row[9] or 0
            total_distance += distance_km
            
            visits.append({
                "sequence": row[1],
                "lat": row[2],
                "lng": row[3],
                "accuracy_m": row[4],
                "address": row[5] or f"{row[2]:.5f}, {row[3]:.5f}",
                "visit_type": row[6],
                "customer_name": row[7],
                "notes": row[8],
                "distance_km": round(distance_km, 2),
                "time": visit_time.strftime("%I:%M %p") if visit_time else None,
                "visited_at": visit_time.isoformat() if visit_time else None
            })
        
        return {
            "salesman": {
                "id": salesman[0],
                "name": salesman[1],
                "username": salesman[2],
                "photo_url": salesman[3],
                "phone": salesman[4],
                "email": salesman[5]
            },
            "date": query_date.isoformat(),
            "summary": {
                "start_time": start_time.strftime("%I:%M %p") if start_time else None,
                "end_time": end_time.strftime("%I:%M %p") if end_time else None,
                "total_visits": len(visits),
                "total_distance_km": round(total_distance, 2)
            },
            "visits": visits,
            # Route coordinates for polyline (in order)
            "route_path": [[v["lat"], v["lng"]] for v in visits]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/salesmen/routes/today")
async def get_all_routes_today(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary of all salesmen routes for today"""
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if user_role.upper() not in ['ADMIN', 'RECEPTION', 'MANAGER']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        ensure_tables_exist(db)
        
        result = db.execute(text("""
            SELECT 
                vl.salesman_id,
                u.full_name,
                u.photograph,
                COUNT(vl.id) as visit_count,
                SUM(vl.distance_from_prev_km) as total_distance,
                MIN(vl.visited_at) as start_time,
                MAX(vl.visited_at) as end_time
            FROM salesman_visit_logs vl
            JOIN users u ON vl.salesman_id = u.id
            WHERE vl.visit_date = :today
            GROUP BY vl.salesman_id, u.full_name, u.photograph
            ORDER BY u.full_name
        """), {"today": date.today()})
        
        routes = []
        for row in result:
            routes.append({
                "salesman_id": row[0],
                "name": row[1],
                "photo_url": row[2],
                "visit_count": row[3],
                "total_distance_km": round(row[4] or 0, 2),
                "start_time": row[5].strftime("%I:%M %p") if row[5] else None,
                "end_time": row[6].strftime("%I:%M %p") if row[6] else None
            })
        
        return {
            "date": date.today().isoformat(),
            "salesmen_with_routes": len(routes),
            "routes": routes
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
