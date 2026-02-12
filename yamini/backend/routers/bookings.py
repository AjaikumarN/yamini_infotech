from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import schemas
import crud
import models
import auth
from database import get_db

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.post("/", response_model=schemas.Booking)
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new booking"""
    return crud.create_booking(db=db, booking=booking)

@router.get("/", response_model=List[schemas.Booking])
def get_bookings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all bookings"""
    return crud.get_bookings(db, skip=skip, limit=limit)
