"""
Verified Attendance Router
Handles biometric + GPS verification for attendance
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import base64
import os
import uuid
from pathlib import Path

import models
import auth
from database import get_db

router = APIRouter(prefix="/api/attendance", tags=["Verified Attendance"])

# Request/Response Models
class VerifiedCheckinRequest(BaseModel):
    employee_id: int
    check_in_time: str
    # Face data
    face_image: str  # Base64 encoded
    face_confidence: float
    # Location data
    latitude: float
    longitude: float
    address: str
    formatted_address: str
    location_accuracy: float
    location_type: str
    place_id: Optional[str] = None
    # Metadata
    verification_method: str = "BIOMETRIC_GPS"
    device_info: Optional[str] = None

class FaceVerificationRequest(BaseModel):
    employee_id: int
    face_image: str  # Base64 encoded

class FaceVerificationResponse(BaseModel):
    matched: bool
    confidence: float
    message: str

@router.post("/verified-checkin")
async def verified_checkin(
    request: Request,
    data: VerifiedCheckinRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit verified attendance with biometric + GPS proof
    """
    try:
        # Validate employee
        if data.employee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Check if already checked in today
        check_in_date = datetime.fromisoformat(data.check_in_time.replace('Z', '+00:00')).date()
        existing_attendance = db.query(models.Attendance).filter(
            models.Attendance.employee_id == data.employee_id,
            models.Attendance.attendance_date == check_in_date
        ).first()
        
        if existing_attendance:
            raise HTTPException(
                status_code=400,
                detail="Already checked in today. Only one check-in per day is allowed."
            )
        
        # Validate location accuracy (more lenient)
        if data.location_accuracy > 100:
            raise HTTPException(
                status_code=400,
                detail=f"Location accuracy too low ({data.location_accuracy}m). Required < 100m"
            )
        
        # Log location type but don't block (ROOFTOP is ideal but not required)
        if data.location_type != "ROOFTOP":
            print(f"Warning: Location type is {data.location_type}, not ROOFTOP")
        
        # Save face image
        face_image_path = None
        if data.face_image:
            face_image_path = save_face_image(data.face_image, data.employee_id)
        
        # Create attendance record
        check_in_datetime = datetime.fromisoformat(data.check_in_time.replace('Z', '+00:00'))
        
        attendance = models.Attendance(
            employee_id=data.employee_id,
            date=check_in_datetime,
            attendance_date=check_in_datetime.date(),
            location=data.address,
            latitude=data.latitude,
            longitude=data.longitude,
            status="Present",
            check_in_time=check_in_datetime.strftime('%H:%M:%S'),
            check_in_lat=data.latitude,
            check_in_lng=data.longitude,
            photo_url=face_image_path
        )
        
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return {
            "success": True,
            "message": "Attendance verified and recorded",
            "attendance_id": attendance.id,
            "verification": {
                "face_confidence": data.face_confidence,
                "location_accuracy": data.location_accuracy,
                "location_type": data.location_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Verified checkin error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-face", response_model=FaceVerificationResponse)
async def verify_face(
    data: FaceVerificationRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify captured face against employee master profile
    In production, this should use face recognition AI (AWS Rekognition, Azure Face API, etc.)
    """
    try:
        # Get employee master photo
        employee = db.query(models.User).filter(models.User.id == data.employee_id).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # In production: Compare face_image with employee.photograph using AI
        # For demo: Return simulated verification
        
        # Simulate face matching (in production, call face recognition API)
        confidence = simulate_face_matching(data.face_image, employee.photograph)
        
        matched = confidence >= 70.0  # Threshold
        
        return FaceVerificationResponse(
            matched=matched,
            confidence=confidence,
            message="Face verified successfully" if matched else "Face match confidence too low"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Face verification error: {e}")
        raise HTTPException(status_code=500, detail="Face verification failed")

def save_face_image(base64_image: str, employee_id: int) -> str:
    """Save base64 face image to disk"""
    try:
        # Remove data URI prefix if present
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_image)
        
        # Create directory
        upload_dir = Path("uploads/attendance/faces")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"face_{employee_id}_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
        file_path = upload_dir / filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        return str(file_path)
        
    except Exception as e:
        print(f"Error saving face image: {e}")
        return None

def simulate_face_matching(captured_face: str, master_photo: Optional[str]) -> float:
    """
    Simulate face matching
    In production: Use AWS Rekognition, Azure Face API, or similar
    """
    # For demo purposes, return a random confidence between 85-98%
    import random
    return round(random.uniform(85.0, 98.0), 1)

@router.get("/history")
async def get_attendance_history(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Get attendance history for current user"""
    attendances = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id
    ).order_by(
        models.Attendance.date.desc()
    ).offset(skip).limit(limit).all()
    
    return attendances
