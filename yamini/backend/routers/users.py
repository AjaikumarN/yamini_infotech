from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import models
import schemas
import crud
import auth
from database import get_db
from typing import List
import os
from pathlib import Path
import uuid

router = APIRouter(prefix="/api/users", tags=["users"])

# Standardized upload directories
UPLOAD_EMPLOYEE_DIR = "uploads/employees"
os.makedirs(UPLOAD_EMPLOYEE_DIR, exist_ok=True)

@router.get("/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current logged-in user info"""
    return current_user

@router.get("/salesmen/", response_model=List[schemas.User])
def get_salesmen(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_optional)
):
    """Get all salesmen (accessible to reception for enquiry assignment)"""
    salesmen = db.query(models.User).filter(
        models.User.role == 'SALESMAN'
    ).all()
    return salesmen

@router.get("/", response_model=List[schemas.User])
def get_users(
    role: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_optional)
):
    """Get all users with optional role filter (RECEPTION can view engineers and salesmen for assignment)"""
    
    # If not authenticated, return empty list
    if not current_user:
        return []
    
    # Reception can view SERVICE_ENGINEER and SALESMAN for assignment purposes
    if current_user.role == models.UserRole.RECEPTION:
        if role and role == "SERVICE_ENGINEER":
            users = db.query(models.User).filter(
                models.User.role == models.UserRole.SERVICE_ENGINEER,
                models.User.is_active == True
            ).all()
            return users
        elif role and role == "SALESMAN":
            users = db.query(models.User).filter(
                models.User.role == models.UserRole.SALESMAN,
                models.User.is_active == True
            ).all()
            return users
        else:
            raise HTTPException(status_code=403, detail="Reception can only view salesmen or service engineers")
    
    # Admin can view all users
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can view all users")
    
    query = db.query(models.User)
    
    if role:
        query = query.filter(models.User.role == role)
    
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_permission("manage_employees"))
):
    """Create a new user (requires manage_employees permission)"""
    # Check if username already exists
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists
    existing_email = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud.create_user(db, user)

@router.get("/{user_id}", response_model=schemas.User)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get a specific user by ID (salesmen can view to see assigned users)"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update a user - Users can update their own profile, admin/managers can update others"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions: users can update their own profile, or admin/managers can update anyone
    if user_id != current_user.id:
        # Trying to update someone else's profile - requires manage_employees
        if current_user.role not in [models.UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Permission denied. You can only update your own profile")
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    
    # Check username uniqueness if being updated (exclude current user)
    if 'username' in update_data and update_data['username'] != db_user.username:
        existing = db.query(models.User).filter(
            models.User.username == update_data['username'],
            models.User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Check email uniqueness if being updated (exclude current user)
    if 'email' in update_data and update_data['email'] != db_user.email:
        existing = db.query(models.User).filter(
            models.User.email == update_data['email'],
            models.User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
    
    # Hash password if being updated
    if 'password' in update_data:
        update_data['hashed_password'] = auth.get_password_hash(update_data.pop('password'))
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_permission("manage_employees"))
):
    """Soft delete a user by setting is_active to False"""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete - just mark as inactive instead of deleting
    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    
    return {"message": "User deactivated successfully"}


@router.post("/upload-photo")
async def upload_employee_photo(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Upload employee photograph"""
    # Use standardized upload directory
    upload_dir = Path(UPLOAD_EMPLOYEE_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Return relative path — never store absolute localhost URLs
    return {
        "file_path": f"/uploads/employees/{unique_filename}",
        "url": f"/uploads/employees/{unique_filename}"
    }
