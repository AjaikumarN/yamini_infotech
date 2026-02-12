from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import schemas
import models
import auth
from database import get_db
from notification_service import NotificationService

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def generate_order_id(db: Session) -> str:
    """Generate unique order ID"""
    count = db.query(models.Order).count()
    return f"ORD-{datetime.now().strftime('%Y%m%d')}-{count + 1:04d}"

def generate_invoice_number(db: Session) -> str:
    """Generate unique invoice number"""
    count = db.query(models.Order).filter(models.Order.invoice_generated == True).count()
    return f"INV-{datetime.now().strftime('%Y%m%d')}-{count + 1:04d}"

@router.post("/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendance_today)
):
    """Create order - Salesman only (from CONVERTED enquiry) - Attendance required"""
    
    # Only salesman and admin can create orders
    if current_user.role not in [models.UserRole.SALESMAN, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only salesmen can create orders")
    
    # Get enquiry
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == order.enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    
    # Auto-convert enquiry if not already converted
    if enquiry.status != "CONVERTED":
        enquiry.status = "CONVERTED"
        enquiry.converted_to_order = True
        db.add(enquiry)
    
    # Validation 2: Must be assigned to current salesman (unless admin)
    if current_user.role == models.UserRole.SALESMAN and enquiry.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not your enquiry. You can only create orders for your assigned enquiries")
    
    # Validation 3: Check if order already exists for this enquiry
    existing_order = db.query(models.Order).filter(models.Order.enquiry_id == enquiry.id).first()
    if existing_order:
        # If order exists and is still PENDING, allow update
        if existing_order.status == "PENDING":
            # Update existing order instead of creating new one
            existing_order.quantity = order.quantity
            existing_order.discount_percent = order.discount_percent
            existing_order.expected_delivery_date = order.expected_delivery_date
            existing_order.notes = order.notes
            db.commit()
            db.refresh(existing_order)
            return existing_order
        else:
            raise HTTPException(status_code=400, detail=f"Cannot modify order - status is {existing_order.status}")
    
    # Get product details (optional - can use product_interest as fallback)
    product = None
    product_name = enquiry.product_interest or "General Product"
    unit_price = order.unit_price if hasattr(order, 'unit_price') and order.unit_price else 0
    
    if enquiry.product_id:
        product = db.query(models.Product).filter(models.Product.id == enquiry.product_id).first()
        if product:
            product_name = product.name
            unit_price = product.price
    
    # Get customer (optional - can use customer_name from enquiry)
    customer = None
    customer_name = enquiry.customer_name
    
    if enquiry.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == enquiry.customer_id).first()
        if customer:
            customer_name = customer.name
    
    # Calculate amounts
    discount_amount = (unit_price * order.quantity * order.discount_percent) / 100
    total_amount = (unit_price * order.quantity) - discount_amount
    
    # Create order
    db_order = models.Order(
        order_id=generate_order_id(db),
        enquiry_id=enquiry.id,
        salesman_id=enquiry.assigned_to,
        customer_id=customer.id if customer else None,
        product_id=product.id if product else None,
        customer_name=customer_name,
        product_name=product_name,
        quantity=order.quantity,
        unit_price=unit_price,
        discount_percent=order.discount_percent,
        discount_amount=discount_amount,
        total_amount=total_amount,
        expected_delivery_date=order.expected_delivery_date,
        notes=order.notes,
        status="PENDING"
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # PHASE 4: Send notifications
    try:
        NotificationService.notify_order_created(
            db=db,
            order=db_order,
            created_by_user=current_user
        )
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to send order notifications: {e}")
    
    return db_order

@router.get("/", response_model=List[schemas.Order])
def get_orders(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get orders - Role-based access"""
    
    query = db.query(models.Order)
    
    # Salesman can only see their own orders
    if current_user.role == models.UserRole.SALESMAN:
        query = query.filter(models.Order.salesman_id == current_user.id)
    # Admin and Reception can see all orders
    elif current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if status:
        query = query.filter(models.Order.status == status)
    
    return query.order_by(models.Order.created_at.desc()).all()

@router.get("/my-orders", response_model=List[schemas.Order])
def get_my_orders(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get orders for salesman (SALESMAN or ADMIN viewing)"""
    # Allow admin to view any salesman's orders by passing user_id
    if current_user.role == models.UserRole.ADMIN and user_id:
        target_user_id = user_id
    elif current_user.role == models.UserRole.SALESMAN:
        target_user_id = current_user.id
    else:
        raise HTTPException(status_code=403, detail="Only salesmen can access this endpoint")
    
    return db.query(models.Order).filter(
        models.Order.salesman_id == target_user_id
    ).order_by(models.Order.created_at.desc()).all()

@router.get("/pending-approval", response_model=List[schemas.Order])
def get_pending_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get pending orders - Admin and Reception can view, only Admin can approve"""
    
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Only admin and reception can view pending orders")
    
    return db.query(models.Order).filter(
        models.Order.status == "PENDING"
    ).order_by(models.Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=schemas.Order)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get specific order"""
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Salesman can only see their own orders
    if current_user.role == models.UserRole.SALESMAN and order.salesman_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own orders")
    
    return order

@router.put("/{order_id}/approve", response_model=schemas.Order)
def approve_order(
    order_id: int,
    approval: schemas.OrderApprove,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_order_approval)  # Admin only
):
    """Approve or reject order - ADMIN ONLY (Backend enforced)"""
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "PENDING":
        raise HTTPException(status_code=400, detail="Order is not pending approval")
    
    if approval.approved:
        # Get product to check stock (only if product was specified)
        product = None
        if order.product_id:
            product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            
            # Check stock availability
            if product.stock_quantity < order.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock. Available: {product.stock_quantity}, Required: {order.quantity}"
                )
            
            # Atomic transaction: Deduct stock
            product.stock_quantity -= order.quantity
        
        # Generate invoice
        order.invoice_number = generate_invoice_number(db)
        order.invoice_generated = True
        order.stock_deducted = True
        order.status = "APPROVED"
        order.approved_by = current_user.id
        order.approved_at = datetime.utcnow()
        
        # Update customer total purchases
        customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()
        if customer:
            customer.total_purchases += 1
            customer.total_value += order.total_amount
        
    else:
        # Reject order
        order.status = "REJECTED"
        order.approved_by = current_user.id
        order.approved_at = datetime.utcnow()
        order.rejection_reason = approval.rejection_reason
    
    db.commit()
    db.refresh(order)
    
    # PHASE 4: Send notifications
    try:
        if approval.approved:
            NotificationService.notify_order_approved(
                db=db,
                order=order,
                approved_by=current_user
            )
        else:
            NotificationService.notify_order_rejected(
                db=db,
                order=order,
                rejected_by=current_user,
                reason=approval.rejection_reason or "No reason provided"
            )
    except Exception as e:
        import logging
        logging.error(f"Failed to send order approval/rejection notifications: {e}")
    
    return order


@router.put("/{order_id}/reject", response_model=schemas.Order)
def reject_order(
    order_id: int,
    rejection: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_order_approval)  # Admin only
):
    """Reject an order - ADMIN ONLY"""
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "PENDING":
        raise HTTPException(status_code=400, detail="Order is not pending approval")
    
    reason = rejection.get('reason', 'No reason provided')
    
    order.status = "REJECTED"
    order.rejection_reason = reason
    order.rejected_by = current_user.id
    order.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    # Send rejection notification
    try:
        NotificationService.notify_order_rejected(
            db=db,
            order=order,
            rejected_by=current_user,
            reason=reason
        )
    except Exception as e:
        import logging
        logging.error(f"Failed to send order rejection notification: {e}")
    
    return order


@router.put("/{order_id}", response_model=schemas.Order)
def update_order(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_order_approval)  # Admin only
):
    """Update order - ADMIN ONLY (Backend enforced, before approval)"""
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Cannot edit approved/rejected orders
    if order.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot edit order after approval/rejection")
    
    # Update fields
    if order_update.quantity is not None:
        order.quantity = order_update.quantity
        # Recalculate amounts
        discount_amount = (order.unit_price * order.quantity * order.discount_percent) / 100
        order.discount_amount = discount_amount
        order.total_amount = (order.unit_price * order.quantity) - discount_amount
    
    if order_update.discount_percent is not None:
        order.discount_percent = order_update.discount_percent
        # Recalculate amounts
        discount_amount = (order.unit_price * order.quantity * order.discount_percent) / 100
        order.discount_amount = discount_amount
        order.total_amount = (order.unit_price * order.quantity) - discount_amount
    
    if order_update.expected_delivery_date is not None:
        order.expected_delivery_date = order_update.expected_delivery_date
    
    if order_update.notes is not None:
        order.notes = order_update.notes
    
    db.commit()
    db.refresh(order)
    
    return order

@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)  # Admin only
):
    """Update order status - ADMIN GOD MODE (can override any status)"""
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_status = status_update.get('status')
    reason = status_update.get('reason', '')
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Admin can override - record the change
    order.status = new_status
    order.status_change_reason = reason
    
    db.commit()
    db.refresh(order)
    
    return order

@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_order_approval)  # Admin only
):
    """Delete order - ADMIN ONLY (Backend enforced, only if PENDING)"""
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != "PENDING":
        raise HTTPException(status_code=400, detail="Cannot delete approved/rejected orders")
    
    db.delete(order)
    db.commit()
    
    return {"message": "Order deleted successfully"}
