"""
Settings API Router
Admin system configuration
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_admin
from pydantic import BaseModel

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    company_name: str = None
    email: str = None
    phone: str = None
    address: str = None
    sla_normal_hours: int = None
    sla_urgent_hours: int = None
    sla_critical_hours: int = None
    attendance_cutoff_time: str = None

@router.get("/")
def get_settings(
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get system settings - Admin only"""
    # For now, return default settings
    # In production, store these in a settings table
    return {
        "company_name": "Yamini Infotech",
        "email": "info@yamini-infotech.com",
        "phone": "+91 1234567890",
        "address": "Business Address",
        "sla_normal_hours": 24,
        "sla_urgent_hours": 6,
        "sla_critical_hours": 2,
        "attendance_cutoff_time": "09:30"
    }

@router.put("/")
def update_settings(
    settings: SettingsUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update system settings - Admin only"""
    # For now, just return success
    # In production, update settings table
    return {"message": "Settings updated successfully", "settings": settings.dict()}
