"""
Stock Movement Routes - Enterprise-Grade
All balance / analytics queries delegate to services.stock_service.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import StockMovement, User, UserRole, Complaint
from services.stock_service import (
    approve_movement,
    get_all_stock_balances,
    get_engineer_analytics,
    get_engineer_own_usage,
    get_item_stock_balance,
    get_low_stock_alerts,
    get_stock_valuation,
    get_summary_stats,
    get_total_inventory_value,
    mark_paid,
    reject_movement,
)
from services.whatsapp_service import WhatsAppMessageTemplates
from services.communication_queue import queue_customer_whatsapp, notify_roles

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stock-movements", tags=["stock-movements"])


# --- Pydantic schemas ---

class StockMovementCreate(BaseModel):
    movement_type: str
    item_name: str
    quantity: int
    unit_cost: float = 0.0
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    engineer_id: Optional[int] = None
    service_request_id: Optional[int] = None
    notes: Optional[str] = None

    @validator("engineer_id", "service_request_id", pre=True)
    def empty_str_to_none_int(cls, v):
        if v == "" or v == "":
            return None
        return v

    @validator("reference_type", "reference_id", "notes", pre=True)
    def empty_str_to_none_str(cls, v):
        if v == "" or v == "":
            return None
        return v


class StockMovementResponse(BaseModel):
    id: int
    movement_type: str
    item_name: str
    quantity: int
    unit_cost: float
    reference_type: Optional[str]
    reference_id: Optional[str]
    date: date
    logged_by: int
    logged_by_name: Optional[str] = None
    approval_status: str
    approved_by: Optional[int]
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    payment_status: str
    invoice_reference: Optional[str]
    payment_updated_by: Optional[int] = None
    payment_updated_at: Optional[datetime] = None
    service_request_id: Optional[int]
    engineer_id: Optional[int]
    engineer_name: Optional[str] = None
    notes: Optional[str]
    created_at: datetime
    delivery_status: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalUpdate(BaseModel):
    approval_status: str


class PaymentUpdate(BaseModel):
    payment_status: str


class DeliveryStatusUpdate(BaseModel):
    delivery_status: str
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    failure_reason: Optional[str] = None


# --- Helpers ---

def _require_reception_or_admin(user: User):
    if user.role not in (UserRole.RECEPTION, UserRole.ADMIN):
        raise HTTPException(403, "Only Reception or Admin can perform this action")


def _build_response(m: StockMovement, db: Session) -> StockMovementResponse:
    logged = db.query(User).filter(User.id == m.logged_by).first()
    approved = db.query(User).filter(User.id == m.approved_by).first() if m.approved_by else None
    engineer = db.query(User).filter(User.id == m.engineer_id).first() if m.engineer_id else None
    return StockMovementResponse(
        id=m.id,
        movement_type=m.movement_type,
        item_name=m.item_name,
        quantity=m.quantity,
        unit_cost=m.unit_cost or 0,
        reference_type=m.reference_type,
        reference_id=m.reference_id,
        date=m.date,
        logged_by=m.logged_by,
        logged_by_name=logged.full_name if logged else None,
        approval_status=m.approval_status or "PENDING",
        approved_by=m.approved_by,
        approved_by_name=approved.full_name if approved else None,
        approved_at=m.approved_at,
        payment_status=m.payment_status or "PENDING",
        invoice_reference=m.invoice_reference,
        payment_updated_by=m.payment_updated_by,
        payment_updated_at=m.payment_updated_at,
        service_request_id=m.service_request_id,
        engineer_id=m.engineer_id,
        engineer_name=engineer.full_name if engineer else None,
        notes=m.notes,
        created_at=m.created_at,
        delivery_status=m.delivery_status,
    )


# === CREATE (Reception + Admin) ===

@router.post("/", response_model=StockMovementResponse)
def log_stock_movement(
    data: StockMovementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_reception_or_admin(current_user)
    if data.movement_type not in ("IN", "OUT"):
        raise HTTPException(400, "movement_type must be IN or OUT")
    if data.quantity <= 0:
        raise HTTPException(400, "quantity must be > 0")
    if data.movement_type == "OUT" and data.engineer_id:
        eng = db.query(User).filter(User.id == data.engineer_id).first()
        if not eng or eng.role != UserRole.SERVICE_ENGINEER:
            raise HTTPException(400, "Invalid engineer ID")
    if data.service_request_id:
        ticket = db.query(Complaint).filter(Complaint.id == data.service_request_id).first()
        if not ticket:
            raise HTTPException(400, f"Ticket ID {data.service_request_id} not found")
    movement = StockMovement(
        movement_type=data.movement_type,
        item_name=data.item_name,
        quantity=data.quantity,
        unit_cost=data.unit_cost,
        reference_type=data.reference_type,
        reference_id=data.reference_id,
        service_request_id=data.service_request_id,
        engineer_id=data.engineer_id,
        notes=data.notes,
        payment_status="PENDING",
        approval_status="PENDING",
        date=date.today(),
        logged_by=current_user.id,
    )
    try:
        db.add(movement)
        db.commit()
        db.refresh(movement)

        # Auto-generate reference_id if not provided
        if not movement.reference_id:
            prefix = "STK-IN" if movement.movement_type == "IN" else "STK-OUT"
            movement.reference_id = f"{prefix}-{movement.id}"
            db.commit()
            db.refresh(movement)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create stock movement: {e}")
        raise HTTPException(500, f"Failed to create stock movement: {str(e)}")

    return _build_response(movement, db)


# === LIST (Reception + Admin) ===

@router.get("/", response_model=List[StockMovementResponse])
def get_stock_movements(
    today: bool = False,
    approval_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_reception_or_admin(current_user)
    q = db.query(StockMovement)
    if today:
        q = q.filter(StockMovement.date == date.today())
    if approval_status:
        q = q.filter(StockMovement.approval_status == approval_status)
    if payment_status:
        q = q.filter(StockMovement.payment_status == payment_status)
    movements = q.order_by(StockMovement.created_at.desc()).all()
    return [_build_response(m, db) for m in movements]


# === APPROVE / REJECT (Admin only) ===

@router.put("/{movement_id}/approve")
def approve_stock_movement(
    movement_id: int,
    data: ApprovalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Only Admin can approve/reject stock movements")
    if data.approval_status not in ("APPROVED", "REJECTED"):
        raise HTTPException(400, "Must be APPROVED or REJECTED")
    try:
        if data.approval_status == "APPROVED":
            approve_movement(db, movement_id, current_user)
        else:
            reject_movement(db, movement_id, current_user)
        db.commit()
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"message": f"Stock movement {data.approval_status.lower()} successfully"}


# === PAYMENT (Reception + Admin, only after approval) ===

@router.put("/{movement_id}/payment")
def update_payment_status(
    movement_id: int,
    data: PaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_reception_or_admin(current_user)
    if data.payment_status != "PAID":
        raise HTTPException(400, "Only transition to PAID is allowed")
    try:
        mark_paid(db, movement_id, current_user)
        db.commit()
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"message": "Payment status updated to PAID"}


# === DELETE (Admin only, PENDING only) ===

@router.delete("/{movement_id}")
def delete_stock_movement(
    movement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Only Admin can delete stock movements")
    movement = db.query(StockMovement).filter(StockMovement.id == movement_id).first()
    if not movement:
        raise HTTPException(404, "Stock movement not found")
    if movement.approval_status != "PENDING":
        raise HTTPException(400, "Cannot delete - movement is already approved/rejected")
    db.delete(movement)
    db.commit()
    return {"message": "Stock movement deleted successfully"}


# === DELIVERY STATUS (Reception + Admin) ===

@router.put("/{movement_id}/delivery-status")
def update_delivery_status(
    movement_id: int,
    data: DeliveryStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_reception_or_admin(current_user)
    valid = ("DELIVERED", "FAILED", "REATTEMPT")
    if data.delivery_status not in valid:
        raise HTTPException(400, f"Status must be one of: {', '.join(valid)}")
    movement = db.query(StockMovement).filter(StockMovement.id == movement_id).first()
    if not movement:
        raise HTTPException(404, "Stock movement not found")
    movement.delivery_status = data.delivery_status
    whatsapp_queued = False
    if data.delivery_status in ("FAILED", "REATTEMPT") and data.customer_phone:
        try:
            cname = data.customer_name or "Customer"
            if data.delivery_status == "FAILED":
                msg = WhatsAppMessageTemplates.delivery_failed(
                    customer_name=cname,
                    reference_id=movement.reference_id or f"DEL-{movement.id}",
                    item_name=getattr(movement, 'item_name', 'Item') or "Item",
                )
                evt = "DELIVERY_FAILED"
            else:
                msg = WhatsAppMessageTemplates.delivery_reattempt(customer_name=cname)
                evt = "DELIVERY_REATTEMPT"
            queue_customer_whatsapp(
                db=db, event_type=evt,
                phone=data.customer_phone, message=msg,
                reference_table="stock_movements", reference_id=movement.id,
                customer_name=cname,
            )
            whatsapp_queued = True
        except Exception as e:
            logger.error("WhatsApp delivery queue failed: %s", e)

    # Staff notification → Admin
    try:
        notify_roles(
            db=db, roles=["ADMIN"],
            title=f"Delivery {data.delivery_status}",
            message=f"Stock movement #{movement.id} marked {data.delivery_status}",
            module="stock_movements", entity_type="stock_movement", entity_id=movement.id,
            priority="HIGH" if data.delivery_status == "FAILED" else "NORMAL",
        )
    except Exception:
        pass

    db.commit()
    return {"message": f"Delivery status updated to {data.delivery_status}", "whatsapp_queued": whatsapp_queued}


# === ANALYTICS / DASHBOARD (Admin only) ===

@router.get("/analytics/summary")
def stock_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Admin only")
    return get_summary_stats(db)


@router.get("/analytics/engineer")
def engineer_analytics(
    period: str = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Admin only")
    return get_engineer_analytics(db, period)


@router.get("/analytics/valuation")
def stock_valuation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Admin only")
    return {
        "total_inventory_value": get_total_inventory_value(db),
        "products": get_stock_valuation(db),
    }


@router.get("/analytics/low-stock")
def low_stock_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Admin only")
    return {"alerts": get_low_stock_alerts(db)}


@router.get("/analytics/balances")
def all_balances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in (UserRole.ADMIN, UserRole.RECEPTION):
        raise HTTPException(403, "Access denied")
    return {"items": get_all_stock_balances(db)}


# === ENGINEER OWN USAGE ===

@router.get("/my-usage")
def my_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.SERVICE_ENGINEER:
        raise HTTPException(403, "Only Service Engineers can access this")
    return get_engineer_own_usage(db, current_user.id)
