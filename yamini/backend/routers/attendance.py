"""
Attendance Management Router
Handles employee attendance check-in/check-out and status tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from datetime import datetime, date, timedelta
from typing import List, Optional
import pytz
import models
import schemas
import crud
from auth import get_current_user, get_db
import os
import shutil
from pathlib import Path
import requests
from s3_service import upload_file as s3_upload

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

# IST timezone
IST = pytz.timezone('Asia/Kolkata')

# Tracking session roles eligible for auto-session on attendance
_FIELD_ROLES = {models.UserRole.SALESMAN, models.UserRole.SERVICE_ENGINEER}


def _auto_create_tracking_session(db, user, attendance_id: int):
    """Auto-create a tracking session for field staff on attendance check-in."""
    try:
        role_val = user.role.value if hasattr(user.role, 'value') else str(user.role)
        if user.role in _FIELD_ROLES or role_val.upper() in ('SALESMAN', 'SERVICE_ENGINEER'):
            from services.unified_tracking import create_tracking_session
            session = create_tracking_session(db, user, attendance_id=attendance_id)
            db.commit()
            import logging
            logging.getLogger(__name__).info(
                f"Tracking session auto-created: user={user.id}, session={session.id}"
            )
    except ValueError:
        pass  # Session already exists — OK
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Auto tracking session failed: {e}")
        # Don't fail attendance on tracking error

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/attendance")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def reverse_geocode(latitude: float, longitude: float) -> str:
    """
    Convert GPS coordinates to human-readable address using OpenStreetMap Nominatim
    Returns: Address string like "New Bus Stand, Tirunelveli, Tamil Nadu, India"
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse"
        params = {
            'lat': latitude,
            'lon': longitude,
            'format': 'json',
            'zoom': 18,
            'addressdetails': 1
        }
        headers = {
            'User-Agent': 'YaminiInfotechERP/1.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract meaningful address parts
            address = data.get('address', {})
            parts = []
            
            # Priority order for address components
            if address.get('road'):
                parts.append(address['road'])
            elif address.get('neighbourhood'):
                parts.append(address['neighbourhood'])
            elif address.get('suburb'):
                parts.append(address['suburb'])
            
            if address.get('city'):
                parts.append(address['city'])
            elif address.get('town'):
                parts.append(address['town'])
            elif address.get('village'):
                parts.append(address['village'])
            
            if address.get('state'):
                parts.append(address['state'])
            
            if parts:
                return ', '.join(parts[:3])  # Limit to 3 parts for readability
            
            # Fallback to display_name
            display_name = data.get('display_name', '')
            if display_name:
                # Take first 3 parts only
                return ', '.join(display_name.split(',')[:3]).strip()
        
    except Exception as e:
        print(f"⚠️ Reverse geocoding failed: {e}")
    
    # Fallback to coordinates
    return f"Lat: {latitude:.6f}, Lng: {longitude:.6f}"


@router.post("/check-in")
async def check_in_with_photo(
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    attendance_status: str = Form(...),
    time: str = Form(...),
    location: str = Form(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check in for the day with photo upload
    Only one check-in per day is allowed
    """
    # ✅ Get IST time (business timezone)
    now_utc = datetime.utcnow()
    now_ist = datetime.now(IST)
    today_ist = now_ist.date()
    
    # Check if already checked in today (using attendance_date)
    existing_attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.id,
        models.Attendance.attendance_date == today_ist
    ).first()
    
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in today"
        )
    
    # Upload photo to S3
    photo_url = s3_upload(photo, "attendance")
    
    # 📘 DISCIPLINE: Check cutoff time (9:30 AM IST)
    cutoff_time = now_ist.replace(hour=9, minute=30, second=0, microsecond=0)
    is_late = now_ist > cutoff_time
    status_text = "Late" if is_late else "Present"
    
    # Create attendance record
    db_attendance = models.Attendance(
        employee_id=current_user.id,
        date=now_utc,  # UTC timestamp for logs
        attendance_date=today_ist,  # Business date (IST) - SINGLE SOURCE OF TRUTH
        time=now_ist.strftime("%H:%M:%S"),
        location=location,
        latitude=latitude,
        longitude=longitude,
        photo_path=photo_url,
        photo_url=photo_url,
        status=status_text
    )
    
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)

    # Auto-create tracking session for field staff (SALESMAN, SERVICE_ENGINEER)
    _auto_create_tracking_session(db, current_user, db_attendance.id)

    # 🔔 Notify admin if late
    if is_late:
        try:
            from notification_service import NotificationService
            NotificationService.create_notification(
                db=db,
                title=f"⚠️ Late Attendance: {current_user.full_name}",
                message=f"Checked in at {now_ist.strftime('%I:%M %p')} (after 9:30 AM cutoff)",
                type="ALERT",
                user_id=None,
                role=models.UserRole.ADMIN
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to send late attendance alert: {e}")
    
    return {
        "id": db_attendance.id,
        "employee_id": db_attendance.employee_id,
        "date": db_attendance.date.isoformat(),
        "attendance_date": db_attendance.attendance_date.isoformat(),
        "time": db_attendance.time,
        "status": db_attendance.status,
        "location": db_attendance.location,
        "latitude": db_attendance.latitude,
        "longitude": db_attendance.longitude,
        "photo_path": db_attendance.photo_path
    }


@router.get("/today")
def get_today_attendance(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ✅ SINGLE SOURCE OF TRUTH: Get today's attendance record
    
    Returns ONE record or None based on attendance_date (IST business date)
    No arrays, no timezone confusion, no frontend parsing
    """
    today_ist = datetime.now(IST).date()
    
    attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.id,
        models.Attendance.attendance_date == today_ist
    ).first()
    
    if not attendance:
        return None
    
    return {
        "id": attendance.id,
        "employee_id": attendance.employee_id,
        "attendance_date": attendance.attendance_date.isoformat(),
        "date": attendance.date.isoformat(),
        "time": attendance.time,
        "status": attendance.status,
        "location": attendance.location,
        "latitude": attendance.latitude,
        "longitude": attendance.longitude,
        "photo_path": attendance.photo_path
    }


@router.post("/check-in-json", response_model=schemas.Attendance)
def check_in(
    attendance_data: schemas.AttendanceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check in for the day (JSON-based, legacy)
    Only one check-in per day is allowed
    """
    now = datetime.now()
    today = now.date()
    
    # Check if already checked in today
    existing_attendance = db.query(models.Attendance).filter(
        and_(
            models.Attendance.employee_id == current_user.id,
            func.date(models.Attendance.date) == today
        )
    ).first()
    
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in today"
        )
    
    # 📘 DISCIPLINE: Check cutoff time (9:30 AM)
    cutoff_time = datetime.combine(today, datetime.min.time()) + timedelta(hours=9, minutes=30)
    is_late = now > cutoff_time
    status_text = "Late" if is_late else "On Time"
    
    # Validate photo path is provided
    if not attendance_data.photo_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="📸 Photo required for attendance"
        )
    
    # Create attendance record
    db_attendance = models.Attendance(
        employee_id=current_user.id,
        date=now,
        time=now.strftime("%H:%M:%S"),
        location=attendance_data.location,
        latitude=attendance_data.latitude,
        longitude=attendance_data.longitude,
        photo_path=attendance_data.photo_path,
        status=status_text
    )
    
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    # 🔔 Notify admin if late
    if is_late:
        try:
            NotificationService.create_notification(
                db=db,
                title=f"⚠️ Late Attendance: {current_user.full_name}",
                message=f"Checked in at {now.strftime('%I:%M %p')} (after 9:30 AM cutoff)",
                type="ALERT",
                user_id=None,
                role=models.UserRole.ADMIN
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to send late attendance alert: {e}")
    
    return db_attendance


@router.get("/today", response_model=Optional[schemas.Attendance])
def get_today_attendance(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get today's attendance record for current user
    Returns None if not checked in
    """
    today = date.today()
    
    print(f"DEBUG: Checking attendance for user {current_user.id} on date {today}")
    
    attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.id,
        models.Attendance.attendance_date == today
    ).first()
    
    if attendance:
        print(f"DEBUG: Found attendance - Date: {attendance.attendance_date}, Status: {attendance.status}")
    else:
        print(f"DEBUG: No attendance found for today")
    
    return attendance


@router.get("/status")
def get_attendance_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if user has checked in today
    Returns: { checked_in: boolean, attendance: object or null }
    """
    today = datetime.now().date()
    
    attendance = db.query(models.Attendance).filter(
        and_(
            models.Attendance.employee_id == current_user.id,
            func.date(models.Attendance.date) == today
        )
    ).first()
    
    return {
        "checked_in": attendance is not None,
        "attendance": attendance
    }


@router.get("/my-history", response_model=List[schemas.Attendance])
def get_my_attendance_history(
    days: int = 30,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get attendance history for current user
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    attendance_records = db.query(models.Attendance).filter(
        and_(
            models.Attendance.employee_id == current_user.id,
            models.Attendance.date >= start_date
        )
    ).order_by(models.Attendance.date.desc()).all()
    
    return attendance_records


@router.get("/employee/{employee_id}", response_model=List[schemas.Attendance])
def get_employee_attendance(
    employee_id: int,
    days: int = 30,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get attendance history for specific employee
    Admin/Reception only
    """
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view other employees' attendance"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    attendance_records = db.query(models.Attendance).filter(
        and_(
            models.Attendance.employee_id == employee_id,
            models.Attendance.date >= start_date
        )
    ).order_by(models.Attendance.date.desc()).all()
    
    return attendance_records


@router.get("/all/today", response_model=List[dict])
def get_all_today_attendance(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get today's attendance for all employees
    Admin/Reception only
    """
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view attendance overview"
        )
    
    now_ist = datetime.now(IST)
    today = now_ist.date()
    
    # Get all active employees only
    employees = db.query(models.User).filter(
        and_(
            models.User.is_active == True,
            models.User.role.in_([
                models.UserRole.SALESMAN,
                models.UserRole.SERVICE_ENGINEER,
                models.UserRole.RECEPTION
            ])
        )
    ).all()
    
    attendance_data = []
    for employee in employees:
        # Query attendance with fallback for older records
        attendance = db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee.id,
            or_(
                models.Attendance.attendance_date == today,
                and_(
                    models.Attendance.attendance_date == None,
                    func.date(models.Attendance.date) == today
                )
            )
        ).first()
        
        attendance_info = None
        if attendance:
            attendance_info = {
                "id": attendance.id,
                "employee_id": attendance.employee_id,
                "date": attendance.date.isoformat() if attendance.date else None,
                "attendance_date": attendance.attendance_date.isoformat() if attendance.attendance_date else None,
                "time": attendance.time,
                "location": attendance.location,
                "latitude": attendance.latitude,
                "longitude": attendance.longitude,
                "photo_path": attendance.photo_path,
                "status": attendance.status,
                "check_in_time": attendance.check_in_time,
                "check_in_lat": attendance.check_in_lat,
                "check_in_lng": attendance.check_in_lng,
                "photo_url": attendance.photo_url
            }
        
        attendance_data.append({
            "employee_id": employee.id,
            "employee_name": employee.full_name,
            "name": employee.full_name,
            "full_name": employee.full_name,
            "role": employee.role,
            "checked_in": attendance is not None,
            "attendance": attendance_info,
            "check_in_time": attendance.check_in_time if attendance else None,
            "location": attendance.location if attendance else None,
            "photo_url": attendance.photo_url if attendance else None,
            "latitude": attendance.latitude if attendance else None,
            "longitude": attendance.longitude if attendance else None,
        })
    
    return attendance_data


@router.get("/all")
def get_all_attendance_by_date(
    date: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get attendance for all employees on a specific date
    Admin/Reception only
    Format: YYYY-MM-DD
    """
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view attendance overview"
        )
    
    try:
        # Parse date string
        from datetime import datetime as dt
        target_date = dt.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Get all active employees only
    employees = db.query(models.User).filter(
        and_(
            models.User.is_active == True,
            models.User.role.in_([
                models.UserRole.SALESMAN,
                models.UserRole.SERVICE_ENGINEER,
                models.UserRole.RECEPTION
            ])
        )
    ).all()
    
    attendance_data = []
    for employee in employees:
        # Query attendance for specific date
        attendance = db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee.id,
            or_(
                models.Attendance.attendance_date == target_date,
                and_(
                    models.Attendance.attendance_date == None,
                    func.date(models.Attendance.date) == target_date
                )
            )
        ).first()
        
        attendance_info = None
        if attendance:
            attendance_info = {
                "id": attendance.id,
                "employee_id": attendance.employee_id,
                "date": attendance.date.isoformat() if attendance.date else None,
                "attendance_date": attendance.attendance_date.isoformat() if attendance.attendance_date else None,
                "time": attendance.time,
                "location": attendance.location,
                "latitude": attendance.latitude,
                "longitude": attendance.longitude,
                "photo_path": attendance.photo_path,
                "status": attendance.status,
                "check_in_time": attendance.check_in_time,
                "check_in_lat": attendance.check_in_lat,
                "check_in_lng": attendance.check_in_lng,
                "photo_url": attendance.photo_url
            }
        
        attendance_data.append({
            "employee_id": employee.id,
            "employee_name": employee.full_name,
            "name": employee.full_name,
            "full_name": employee.full_name,
            "role": employee.role,
            "checked_in": attendance is not None,
            "attendance": attendance_info,
            "check_in_time": attendance.check_in_time if attendance else None,
            "location": attendance.location if attendance else None,
            "photo_url": attendance.photo_url if attendance else None,
            "latitude": attendance.latitude if attendance else None,
            "longitude": attendance.longitude if attendance else None,
        })
    
    return attendance_data


# ========================================    attendance_data = []
    for employee in employees:
        # Query attendance with fallback for older records
        attendance = db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee.id,
            or_(
                models.Attendance.attendance_date == today,
                and_(
                    models.Attendance.attendance_date == None,
                    func.date(models.Attendance.date) == today
                )
            )
        ).first()
        
        attendance_info = None
        if attendance:
            attendance_info = {
                "id": attendance.id,
                "employee_id": attendance.employee_id,
                "date": attendance.date.isoformat() if attendance.date else None,
                "attendance_date": attendance.attendance_date.isoformat() if attendance.attendance_date else None,
                "time": attendance.time,
                "location": attendance.location,
                "latitude": attendance.latitude,
                "longitude": attendance.longitude,
                "photo_path": attendance.photo_path,
                "status": attendance.status,
                "check_in_time": attendance.check_in_time,
                "check_in_lat": attendance.check_in_lat,
                "check_in_lng": attendance.check_in_lng,
                "photo_url": attendance.photo_url
            }
        
        attendance_data.append({
            "employee_id": employee.id,
            "employee_name": employee.full_name,
            "role": employee.role,
            "checked_in": attendance is not None,
            "attendance": attendance_info
        })
    
    return attendance_data


# ========================================
# SIMPLE CHECK-IN ONLY SYSTEM (New)
# ========================================

@router.get("/simple/today")
async def get_simple_attendance_today(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    SIMPLE: Get today's attendance status - CHECK-IN ONLY
    Returns NOT_CHECKED_IN or PRESENT with details
    """
    now_ist = datetime.now(IST)
    today_ist = now_ist.date()
    
    # Check if already checked in today
    attendance = db.query(models.Attendance).filter(
        and_(
            models.Attendance.employee_id == current_user.id,
            models.Attendance.attendance_date == today_ist
        )
    ).first()
    
    if not attendance:
        return {"status": "NOT_CHECKED_IN"}
    
    return {
        "status": "PRESENT",
        "check_in_time": attendance.check_in_time or attendance.time,
        "check_in_lat": attendance.check_in_lat or attendance.latitude,
        "check_in_lng": attendance.check_in_lng or attendance.longitude,
        "location": attendance.location,
        "photo_url": attendance.photo_url,
        "date": today_ist.isoformat()
    }


@router.post("/simple/check-in")
async def simple_check_in(
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    SIMPLE CHECK-IN ONLY: Mark attendance for today with photo
    Business Rule: ONE check-in per day, NO check-out
    """
    now_utc = datetime.utcnow()
    now_ist = datetime.now(IST)
    today_ist = now_ist.date()
    check_in_time_str = now_ist.strftime("%H:%M:%S")
    
    # Check if already checked in today
    existing = db.query(models.Attendance).filter(
        and_(
            models.Attendance.employee_id == current_user.id,
            models.Attendance.attendance_date == today_ist
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for today"
        )
    
    # Upload photo to S3
    photo_url = s3_upload(photo, "attendance")
    
    # Reverse geocode to get human-readable address
    address = reverse_geocode(latitude, longitude)
    
    # Create attendance record - SIMPLE with photo and address
    attendance = models.Attendance(
        employee_id=current_user.id,
        date=now_utc,  # UTC timestamp
        attendance_date=today_ist,  # IST business date
        time=check_in_time_str,
        check_in_time=check_in_time_str,
        latitude=latitude,
        longitude=longitude,
        check_in_lat=latitude,
        check_in_lng=longitude,
        location=address,  # Human-readable address
        photo_path=photo_url,
        photo_url=photo_url,
        status="PRESENT"
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    # 🚀 Auto-create tracking session for field staff
    _auto_create_tracking_session(db, current_user, attendance.id)
    
    return {
        "success": True,
        "message": "Attendance marked successfully",
        "attendance_id": attendance.id,
        "status": "PRESENT",
        "check_in_time": check_in_time_str,
        "photo_url": photo_url,
        "date": today_ist.isoformat()
    }
