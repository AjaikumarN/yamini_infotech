"""
Outstanding Invoices Router
Handles tracking and management of outstanding payments
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
from database import get_db
import models
import schemas
from auth import get_current_user, get_current_user_optional
from audit_logger import log_create, log_update, log_view

router = APIRouter(
    prefix="/api/outstanding",
    tags=["Outstanding Invoices"]
)


class OutstandingCreate(schemas.BaseModel):
    customer_name: str
    invoice_no: str
    total_amount: float
    paid_amount: float = 0
    due_date: date
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    order_id: Optional[int] = None

    class Config:
        from_attributes = True


class OutstandingResponse(schemas.BaseModel):
    id: int
    customer_name: str
    invoice_no: str
    total_amount: float
    paid_amount: float
    balance: float
    due_date: date
    invoice_date: date
    status: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    order_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[OutstandingResponse])
def get_outstanding_invoices(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    min_balance: Optional[float] = None,
    days_overdue: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Get all outstanding invoices with filters"""
    
    query = db.query(models.Outstanding)
    
    if status:
        query = query.filter(models.Outstanding.status == status)
    
    if min_balance is not None:
        query = query.filter(models.Outstanding.balance >= min_balance)
    
    if days_overdue is not None:
        cutoff_date = date.today() - timedelta(days=days_overdue)
        query = query.filter(models.Outstanding.due_date <= cutoff_date)
    
    invoices = query.offset(skip).limit(limit).all()
    
    # Calculate additional stats and update status
    for invoice in invoices:
        today = date.today()
        days_past_due = (today - invoice.due_date).days
        
        if invoice.balance <= 0:
            invoice.status = "PAID"
        elif days_past_due > 0:
            invoice.status = "OVERDUE"
        elif invoice.paid_amount > 0:
            invoice.status = "PARTIAL"
        else:
            invoice.status = "PENDING"
    
    if current_user:
        log_view(db, current_user.id, current_user.username, "Outstanding", 
                 str(len(invoices)), "invoices")
    return invoices


@router.get("/{invoice_id}", response_model=OutstandingResponse)
def get_outstanding_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Get specific outstanding invoice"""
    
    invoice = db.query(models.Outstanding).filter(
        models.Outstanding.id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outstanding invoice not found"
        )
    
    if current_user:
        log_view(db, current_user.id, current_user.username, "Outstanding", 
                 str(invoice.id), "invoice")
    return invoice


@router.post("/", response_model=OutstandingResponse)
def create_outstanding_invoice(
    data: OutstandingCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Create new outstanding invoice record"""
    
    # Check if invoice already exists
    existing = db.query(models.Outstanding).filter(
        models.Outstanding.invoice_no == data.invoice_no
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice {data.invoice_no} already exists"
        )
    
    balance = data.total_amount - data.paid_amount
    
    invoice = models.Outstanding(
        customer_name=data.customer_name,
        invoice_no=data.invoice_no,
        total_amount=data.total_amount,
        paid_amount=data.paid_amount,
        balance=balance,
        due_date=data.due_date,
        invoice_date=date.today(),
        status="PENDING" if balance > 0 else "PAID",
        customer_phone=data.customer_phone,
        customer_email=data.customer_email,
        notes=data.notes,
        order_id=data.order_id
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    if current_user:
        log_create(db, current_user.id, current_user.username, "Outstanding", 
                   str(invoice.id), "invoice")
    
    return invoice


@router.put("/{invoice_id}/payment", response_model=OutstandingResponse)
def record_payment(
    invoice_id: int,
    payment_amount: float,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Record payment towards outstanding invoice"""
    
    invoice = db.query(models.Outstanding).filter(
        models.Outstanding.id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outstanding invoice not found"
        )
    
    invoice.paid_amount += payment_amount
    invoice.balance = invoice.total_amount - invoice.paid_amount
    
    if invoice.balance <= 0:
        invoice.status = "PAID"
    elif invoice.paid_amount > 0:
        invoice.status = "PARTIAL"
    
    db.commit()
    db.refresh(invoice)
    
    if current_user:
        log_update(db, current_user.id, current_user.username, "Outstanding", 
                   str(invoice.id), "invoice", {"action": "payment_recorded"})
    
    return invoice


@router.put("/{invoice_id}", response_model=OutstandingResponse)
def update_outstanding_invoice(
    invoice_id: int,
    data: OutstandingCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Update outstanding invoice details"""
    
    invoice = db.query(models.Outstanding).filter(
        models.Outstanding.id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outstanding invoice not found"
        )
    
    invoice.customer_name = data.customer_name
    invoice.invoice_no = data.invoice_no
    invoice.total_amount = data.total_amount
    invoice.paid_amount = data.paid_amount
    invoice.balance = data.total_amount - data.paid_amount
    invoice.due_date = data.due_date
    invoice.customer_phone = data.customer_phone
    invoice.customer_email = data.customer_email
    invoice.notes = data.notes
    
    if invoice.balance <= 0:
        invoice.status = "PAID"
    elif invoice.paid_amount > 0:
        invoice.status = "PARTIAL"
    else:
        invoice.status = "PENDING"
    
    db.commit()
    db.refresh(invoice)
    
    if current_user:
        log_update(db, current_user.id, current_user.username, "Outstanding", 
                   str(invoice.id), "invoice", {"action": "details_updated"})
    
    return invoice


@router.delete("/{invoice_id}")
def delete_outstanding_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Delete outstanding invoice record"""
    
    invoice = db.query(models.Outstanding).filter(
        models.Outstanding.id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outstanding invoice not found"
        )
    
    invoice_no = invoice.invoice_no
    db.delete(invoice)
    db.commit()
    
    return {
        "message": f"Outstanding invoice {invoice_no} deleted successfully",
        "id": invoice_id
    }


@router.get("/summary/stats")
def get_outstanding_stats(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """Get outstanding invoices summary statistics"""
    
    all_invoices = db.query(models.Outstanding).all()
    today = date.today()
    
    total_outstanding = sum(inv.balance for inv in all_invoices)
    pending_count = len([inv for inv in all_invoices if inv.balance > 0])
    critical_count = len([inv for inv in all_invoices 
                         if (today - inv.due_date).days > 60 and inv.balance > 0])
    warning_count = len([inv for inv in all_invoices 
                        if 30 < (today - inv.due_date).days <= 60 and inv.balance > 0])
    
    return {
        "total_outstanding": total_outstanding,
        "pending_invoices": pending_count,
        "critical_overdue": critical_count,  # > 60 days
        "warning_overdue": warning_count,    # 30-60 days
        "total_invoices": len(all_invoices)
    }
