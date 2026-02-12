from sqlalchemy import Column, Float, String, DateTime, Integer, Boolean, text
from sqlalchemy.sql import func
from database import Base
from fastapi import HTTPException
import asyncio
from datetime import datetime


class LiveLocation(Base):
    """Table for real-time GPS tracking during visits"""
    __tablename__ = "live_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)


async def save_location(db, user_id: int, latitude: float, longitude: float, accuracy: float = 0):
    """Save or update live location"""
    try:
        # Check if user has existing active location
        result = db.execute(
            text("SELECT id FROM live_locations WHERE user_id = :user_id AND is_active = true"),
            {"user_id": user_id}
        )
        existing = result.fetchone()
        
        if existing:
            # Update existing
            db.execute(
                text("""
                    UPDATE live_locations 
                    SET latitude = :lat, longitude = :lon, accuracy = :acc, updated_at = NOW()
                    WHERE user_id = :user_id AND is_active = true
                """),
                {"lat": latitude, "lon": longitude, "acc": accuracy, "user_id": user_id}
            )
        else:
            # Insert new
            db.execute(
                text("""
                    INSERT INTO live_locations (user_id, latitude, longitude, accuracy, is_active)
                    VALUES (:user_id, :lat, :lon, :acc, true)
                """),
                {"user_id": user_id, "lat": latitude, "lon": longitude, "acc": accuracy}
            )
        
        # Don't commit here - let the caller handle the transaction
        return True
    except Exception as e:
        print(f"Location save error: {e}")
        raise  # Re-raise so the caller can handle the rollback


async def get_live_locations(db):
    """Get all active live locations (for admin map view)"""
    try:
        result = db.execute(text("""
            SELECT ll.user_id, u.full_name, ll.latitude, ll.longitude, 
                   ll.accuracy, ll.updated_at, u.photograph, u.phone, u.email
            FROM live_locations ll
            JOIN users u ON ll.user_id = u.id
            WHERE ll.is_active = true 
            ORDER BY ll.updated_at DESC
        """))
        
        locations = []
        for row in result:
            locations.append({
                "user_id": row[0],
                "full_name": row[1],
                "latitude": row[2],
                "longitude": row[3],
                "accuracy": row[4],
                "updated_at": row[5].isoformat() if row[5] else None,
                "photo_url": row[6],
                "phone": row[7],
                "email": row[8]
            })
        
        return locations
    except Exception as e:
        print(f"Get locations error: {e}")
        return []


async def deactivate_user_location(db, user_id: int):
    """Deactivate live tracking when user checks out"""
    try:
        db.execute(
            text("UPDATE live_locations SET is_active = false WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        # Don't commit here - let the caller handle the transaction
        return True
    except Exception as e:
        print(f"Deactivate error: {e}")
        raise  # Re-raise so the caller can handle the rollback
