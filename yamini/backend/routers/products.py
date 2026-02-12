from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas
import crud
import models
import auth
from database import get_db

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.post("/")
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_product_write)  # Admin only
):
    """Create a new product (Admin only - Backend enforced)"""
    return crud.create_product(db=db, product=product)

@router.get("/")
def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all products - PUBLIC ACCESS (no auth required)"""
    # Public view returns basic product info without sensitive stock/pricing details
    return crud.get_products(db, skip=skip, limit=limit)

@router.get("/{product_id}")
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get product by ID - PUBLIC ACCESS (no auth required)"""
    # Public view returns basic product info
    product = crud.get_product_by_id(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/services")
def create_service(
    service: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_permission("manage_services"))
):
    """Create a new service (Admin/Office Staff only)"""
    return crud.create_service(db=db, service=service)

@router.get("/services")
def get_services(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all services - PUBLIC ACCESS (no auth required)"""
    return crud.get_services(db, skip=skip, limit=limit)

# ============================================================================
# INTERNAL ENDPOINTS (Admin only - with sensitive data)
# ============================================================================

@router.get("/internal/inventory")
def get_product_inventory(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_product_write)  # Admin only
):
    """Get product inventory with stock levels (Admin only - Backend enforced)"""
    # Returns complete product info including stock quantities, cost prices, etc.
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products

@router.put("/{product_id}")
def update_product(
    product_id: int,
    product_update: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_product_write)  # Admin only
):
    """Update product (Admin only - Backend enforced)"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}/stock")
def update_product_stock(
    product_id: int,
    stock_quantity: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_stock_write)  # Admin only
):
    """Update product stock (Admin only - Backend enforced, separate from approval flow)"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.stock_quantity = stock_quantity
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_product_write)  # Admin only
):
    """Delete product (Admin only - Backend enforced)"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
