"""
Visitor Management Routes
Reception desk visitor tracking
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime

from database import get_db
from models import Visitor, User, UserRole
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/visitors", tags=["visitors"])


# Schemas
class VisitorCreate(BaseModel):
    name: str
    phone: str
    purpose: str
    whom_to_meet: str
    in_time: str


class VisitorCheckout(BaseModel):
    out_time: str


class VisitorResponse(BaseModel):
    id: int
    name: str
    phone: str
    purpose: str
    whom_to_meet: str
    in_time: str
    out_time: str | None
    date: date
    logged_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# Helper function to check reception role
def require_reception(current_user: User):
    if current_user.role not in [UserRole.RECEPTION, UserRole.ADMIN]:
        raise HTTPException(
            status_code=403, 
            detail="Only Reception or Admin can perform this action"
        )


@router.post("/", response_model=VisitorResponse)
def add_visitor(
    visitor_data: VisitorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add new visitor (Reception/Admin only)"""
    require_reception(current_user)
    
    visitor = Visitor(
        name=visitor_data.name,
        phone=visitor_data.phone,
        purpose=visitor_data.purpose,
        whom_to_meet=visitor_data.whom_to_meet,
        in_time=visitor_data.in_time,
        date=date.today(),
        logged_by=current_user.id
    )
    
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    
    return VisitorResponse(
        id=visitor.id,
        name=visitor.name,
        phone=visitor.phone,
        purpose=visitor.purpose,
        whom_to_meet=visitor.whom_to_meet,
        in_time=visitor.in_time,
        out_time=visitor.out_time,
        date=visitor.date,
        logged_by=visitor.logged_by,
        created_at=visitor.created_at
    )


@router.get("/", response_model=List[VisitorResponse])
def get_visitors(
    today: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get visitors (all or today only)"""
    require_reception(current_user)
    
    query = db.query(Visitor)
    
    if today:
        query = query.filter(Visitor.date == date.today())
    
    visitors = query.order_by(Visitor.created_at.desc()).all()
    
    return [
        VisitorResponse(
            id=v.id,
            name=v.name,
            phone=v.phone,
            purpose=v.purpose,
            whom_to_meet=v.whom_to_meet,
            in_time=v.in_time,
            out_time=v.out_time,
            date=v.date,
            logged_by=v.logged_by,
            created_at=v.created_at
        )
        for v in visitors
    ]


@router.put("/{visitor_id}/checkout", response_model=VisitorResponse)
def checkout_visitor(
    visitor_id: int,
    checkout_data: VisitorCheckout,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark visitor as checked out (Reception/Admin only)"""
    require_reception(current_user)
    
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    visitor.out_time = checkout_data.out_time
    db.commit()
    db.refresh(visitor)
    
    return VisitorResponse(
        id=visitor.id,
        name=visitor.name,
        phone=visitor.phone,
        purpose=visitor.purpose,
        whom_to_meet=visitor.whom_to_meet,
        in_time=visitor.in_time,
        out_time=visitor.out_time,
        date=visitor.date,
        logged_by=visitor.logged_by,
        created_at=visitor.created_at
    )


@router.delete("/{visitor_id}")
def delete_visitor(
    visitor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete visitor entry (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only Admin can delete visitor entries")
    
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    db.delete(visitor)
    db.commit()
    
    return {"message": "Visitor entry deleted successfully"}
