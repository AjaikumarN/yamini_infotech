"""
Invoices Management Router
Handles invoice creation, viewing, and payment tracking
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
import models
import schemas
import auth
from database import get_db
from audit_logger import log_action

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.get("/", response_model=List[dict])
def get_all_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all invoices
    RBAC: Admin and Reception can view all
    """
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Admin or Reception access required")
    
    # Get orders that have invoices generated
    orders_with_invoices = db.query(models.Order).filter(
        models.Order.invoice_generated == True
    ).all()
    
    invoices = []
    for order in orders_with_invoices:
        # Calculate payment status based on order status
        payment_status = "PENDING"
        if order.status == "DELIVERED":
            payment_status = "PAID"
        elif order.status == "APPROVED":
            payment_status = "PENDING"
        elif order.status == "REJECTED":
            payment_status = "CANCELLED"
        
        invoices.append({
            "id": order.id,
            "invoice_number": order.invoice_number,
            "order_id": order.order_id,
            "customer_name": order.customer_name,
            "customer_email": None,  # Would need customer table join
            "total_amount": order.total_amount,
            "tax_amount": order.total_amount * 0.18,  # Assuming 18% GST
            "status": payment_status,
            "payment_status": payment_status,
            "created_at": order.created_at,
            "approved_at": order.approved_at
        })
    
    return invoices


@router.post("/", response_model=dict)
def create_invoice(
    invoice_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """
    Create invoice manually (admin only)
    Creates an order-based invoice
    """
    try:
        # Generate invoice number
        invoice_count = db.query(func.count(models.Order.id)).filter(
            models.Order.invoice_generated == True
        ).scalar()
        invoice_number = f"INV-{invoice_count + 1}"
        
        # Generate order ID
        order_count = db.query(func.count(models.Order.id)).scalar()
        order_id = f"ORD-{order_count + 1}"
        
        # Create order with invoice
        new_order = models.Order(
            order_id=order_id,
            invoice_number=invoice_number,
            customer_name=invoice_data.get("customer_name", "Direct Customer"),
            product_name=invoice_data.get("product_name", "Service/Product"),
            quantity=invoice_data.get("quantity", 1),
            unit_price=invoice_data.get("unit_price", 0),
            total_amount=invoice_data.get("total_amount", 0),
            status="APPROVED",  # Manual invoices are pre-approved
            invoice_generated=True,
            salesman_id=current_user.id,
            approved_by=current_user.id,
            approved_at=datetime.now(),
            notes=invoice_data.get("notes", "Manual invoice created by admin")
        )
        
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        log_action(
            db=db,
            user_id=current_user.id,
            username=current_user.username,
            action="CREATE",
            module="Invoice",
            record_id=invoice_number,
            record_type="Invoice",
            changes=invoice_data
        )
        
        return {
            "id": new_order.id,
            "invoice_number": invoice_number,
            "order_id": order_id,
            "customer_name": new_order.customer_name,
            "customer_email": invoice_data.get("customer_email"),
            "total_amount": new_order.total_amount,
            "status": "PAID" if invoice_data.get("status") == "PAID" else "PENDING",
            "payment_status": invoice_data.get("status", "PENDING"),
            "created_at": new_order.created_at,
            "message": "Invoice created successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{invoice_id}", response_model=dict)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_reception)
):
    """Get specific invoice details"""
    order = db.query(models.Order).filter(
        models.Order.id == invoice_id,
        models.Order.invoice_generated == True
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {
        "id": order.id,
        "invoice_number": order.invoice_number,
        "order_id": order.order_id,
        "customer_name": order.customer_name,
        "product_name": order.product_name,
        "quantity": order.quantity,
        "unit_price": order.unit_price,
        "discount_amount": order.discount_amount,
        "total_amount": order.total_amount,
        "status": "PAID" if order.status == "DELIVERED" else "PENDING",
        "created_at": order.created_at,
        "approved_at": order.approved_at
    }


@router.put("/{invoice_id}", response_model=dict)
def update_invoice(
    invoice_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    """Update invoice (admin only) - limited to payment status"""
    order = db.query(models.Order).filter(
        models.Order.id == invoice_id,
        models.Order.invoice_generated == True
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Admin can update payment status
    if "payment_status" in update_data:
        new_status = update_data["payment_status"]
        if new_status == "PAID":
            order.status = "DELIVERED"
        
        log_action(
            db=db,
            user_id=current_user.id,
            username=current_user.username,
            action="UPDATE",
            module="Invoice",
            record_id=str(invoice_id),
            record_type="Invoice",
            changes={"payment_status": new_status}
        )
    
    db.commit()
    db.refresh(order)
    
    return {
        "id": order.id,
        "invoice_number": order.invoice_number,
        "status": "PAID" if order.status == "DELIVERED" else "PENDING",
        "message": "Invoice updated successfully"
    }


@router.get("/{invoice_id}/export")
def export_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_reception)
):
    """Export invoice as PDF (placeholder)"""
    order = db.query(models.Order).filter(
        models.Order.id == invoice_id,
        models.Order.invoice_generated == True
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # In production, generate actual PDF
    # For now, return invoice data
    return {
        "invoice_number": order.invoice_number,
        "customer": order.customer_name,
        "product": order.product_name,
        "amount": order.total_amount,
        "export_url": f"/exports/invoice_{invoice_id}.pdf",
        "message": "Invoice export ready"
    }


@router.get("/outstanding/summary", response_model=dict)
def get_outstanding_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_reception)
):
    """Get outstanding payments summary"""
    # Get all approved orders that are not delivered (pending payment)
    outstanding_orders = db.query(models.Order).filter(
        models.Order.status == "APPROVED",
        models.Order.invoice_generated == True
    ).all()
    
    total_outstanding = sum(o.total_amount for o in outstanding_orders)
    
    return {
        "total_invoices": len(outstanding_orders),
        "total_amount": total_outstanding,
        "orders": [
            {
                "id": o.id,
                "invoice_number": o.invoice_number,
                "customer_name": o.customer_name,
                "amount": o.total_amount,
                "days_pending": (datetime.now() - o.approved_at).days if o.approved_at else 0
            }
            for o in outstanding_orders
        ]
    }
