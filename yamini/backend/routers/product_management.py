from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from pathlib import Path
from datetime import datetime
from pydantic import BaseModel
from database import get_db
from models import Product, User, UserRole
from auth import get_current_user
import json

router = APIRouter(prefix="/api/products", tags=["Product Management"])

# Pydantic models
class ProductCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    category: str
    model_number: Optional[str] = None
    product_type: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    price_type: str = "FIXED"
    usage_type: Optional[str] = None
    ideal_for: Optional[str] = None
    recommended_usage: Optional[str] = None
    warranty_period: Optional[str] = None
    installation_support: bool = False
    amc_available: bool = False
    specifications: Optional[dict] = None
    status: str = "Active"
    
    # Internal data (only for admin/office_staff)
    purchase_cost: Optional[float] = None
    vendor_name: Optional[str] = None
    stock_quantity: int = 0
    internal_notes: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    model_number: Optional[str] = None
    product_type: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    price_type: Optional[str] = None
    usage_type: Optional[str] = None
    ideal_for: Optional[str] = None
    recommended_usage: Optional[str] = None
    warranty_period: Optional[str] = None
    installation_support: Optional[bool] = None
    amc_available: Optional[bool] = None
    specifications: Optional[dict] = None
    status: Optional[str] = None
    
    # Internal data
    purchase_cost: Optional[float] = None
    vendor_name: Optional[str] = None
    stock_quantity: Optional[int] = None
    internal_notes: Optional[str] = None

# Helper function to check permissions
def has_permission(user: User, permission_code: str, db: Session) -> bool:
    """Check if user has specific permission based on role"""
    if not user.role:
        return False
    
    # Admin has all permissions
    if user.role == UserRole.ADMIN:
        return True
    
    # Office staff has all product permissions
    if user.role == UserRole.OFFICE_STAFF:
        return True
    
    # Salesman can view but not edit internal data
    if user.role == UserRole.SALESMAN:
        if permission_code in ['VIEW_PRODUCT', 'VIEW_PRICING']:
            return True
        return False
    
    return False

# Dependency for checking product management permission
def require_product_permission(permission: str):
    async def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not has_permission(current_user, permission, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have {permission} permission"
            )
        return current_user
    return permission_checker

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(require_product_permission("ADD_PRODUCT")),
    db: Session = Depends(get_db)
):
    """Create a new product (Admin/Office Staff only)"""
    
    # Create product
    new_product = Product(
        name=product.name,
        brand=product.brand,
        category=product.category,
        model_number=product.model_number,
        product_type=product.product_type,
        description=product.description,
        price=product.price,
        price_type=product.price_type,
        usage_type=product.usage_type,
        ideal_for=product.ideal_for,
        recommended_usage=product.recommended_usage,
        warranty_period=product.warranty_period,
        installation_support=product.installation_support,
        amc_available=product.amc_available,
        specifications=json.dumps(product.specifications) if product.specifications else None,
        status=product.status,
        created_by=current_user.id
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Add internal data if provided
    if has_permission(current_user, "VIEW_INTERNAL_DATA", db):
        db.execute("""
            INSERT INTO product_internal (product_id, purchase_cost, vendor_name, stock_quantity, internal_notes)
            VALUES (:pid, :cost, :vendor, :stock, :notes)
        """, {
            "pid": new_product.id,
            "cost": product.purchase_cost,
            "vendor": product.vendor_name,
            "stock": product.stock_quantity,
            "notes": product.internal_notes
        })
        db.commit()
    
    return {
        "message": "Product created successfully",
        "product_id": new_product.id,
        "product": new_product
    }

@router.put("/{product_id}")
async def update_product(
    product_id: int,
    product: ProductUpdate,
    current_user: User = Depends(require_product_permission("EDIT_PRODUCT")),
    db: Session = Depends(get_db)
):
    """Update an existing product (Admin/Office Staff only)"""
    
    # Get existing product
    existing_product = db.query(Product).filter(Product.id == product_id).first()
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product fields
    update_data = product.dict(exclude_unset=True, exclude={
        'purchase_cost', 'vendor_name', 'stock_quantity', 'internal_notes'
    })
    
    if 'specifications' in update_data and update_data['specifications']:
        update_data['specifications'] = json.dumps(update_data['specifications'])
    
    for field, value in update_data.items():
        setattr(existing_product, field, value)
    
    db.commit()
    db.refresh(existing_product)
    
    # Update internal data if user has permission
    if has_permission(current_user, "VIEW_INTERNAL_DATA", db):
        internal_updates = {}
        if product.purchase_cost is not None:
            internal_updates['purchase_cost'] = product.purchase_cost
        if product.vendor_name is not None:
            internal_updates['vendor_name'] = product.vendor_name
        if product.stock_quantity is not None:
            internal_updates['stock_quantity'] = product.stock_quantity
        if product.internal_notes is not None:
            internal_updates['internal_notes'] = product.internal_notes
        
        if internal_updates:
            # Check if internal record exists
            exists = db.execute(
                "SELECT id FROM product_internal WHERE product_id = :pid",
                {"pid": product_id}
            ).fetchone()
            
            if exists:
                set_clause = ", ".join([f"{k} = :{k}" for k in internal_updates.keys()])
                db.execute(
                    f"UPDATE product_internal SET {set_clause} WHERE product_id = :pid",
                    {**internal_updates, "pid": product_id}
                )
            else:
                db.execute("""
                    INSERT INTO product_internal (product_id, purchase_cost, vendor_name, stock_quantity, internal_notes)
                    VALUES (:pid, :cost, :vendor, :stock, :notes)
                """, {
                    "pid": product_id,
                    "cost": internal_updates.get('purchase_cost'),
                    "vendor": internal_updates.get('vendor_name'),
                    "stock": internal_updates.get('stock_quantity', 0),
                    "notes": internal_updates.get('internal_notes')
                })
            
            db.commit()
    
    return {
        "message": "Product updated successfully",
        "product": existing_product
    }

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(require_product_permission("DELETE_PRODUCT")),
    db: Session = Depends(get_db)
):
    """Delete a product (Admin only)"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}

@router.get("/{product_id}/internal")
async def get_product_internal_data(
    product_id: int,
    current_user: User = Depends(require_product_permission("VIEW_INTERNAL_DATA")),
    db: Session = Depends(get_db)
):
    """Get confidential product data (Admin/Office Staff only)"""
    
    internal_data = db.execute("""
        SELECT purchase_cost, vendor_name, stock_quantity, internal_notes, last_updated
        FROM product_internal
        WHERE product_id = :pid
    """, {"pid": product_id}).fetchone()
    
    if not internal_data:
        return {"message": "No internal data found for this product"}
    
    return {
        "purchase_cost": internal_data[0],
        "vendor_name": internal_data[1],
        "stock_quantity": internal_data[2],
        "internal_notes": internal_data[3],
        "last_updated": internal_data[4]
    }

@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    current_user: User = Depends(require_product_permission("EDIT_PRODUCT")),
    db: Session = Depends(get_db)
):
    """Upload product image (Admin/Office Staff only)"""
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create upload directory - use absolute path from backend
    backend_dir = Path(__file__).parent.parent
    upload_dir = backend_dir / "../frontend/public/assets/products"
    upload_dir = upload_dir.resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    timestamp = int(datetime.now().timestamp())
    file_name = f"product_{product_id}_{timestamp}{file_ext}"
    file_path = upload_dir / file_name
    
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Update product image_url
    image_url = f"/assets/products/{file_name}"
    product.image_url = image_url
    db.commit()
    
    return {
        "message": "Image uploaded successfully",
        "image_url": image_url
    }

@router.get("/permissions/check")
async def check_user_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's product management permissions"""
    
    if not current_user.role:
        return {"permissions": []}
    
    # ADMIN GOD MODE - has all permissions
    if current_user.role == UserRole.ADMIN:
        return {
            "permissions": [
                "ADD_PRODUCT",
                "EDIT_PRODUCT",
                "DELETE_PRODUCT",
                "VIEW_INTERNAL_DATA",
                "MANAGE_STOCK",
                "MANAGE_PRICING",
                "MANAGE_SERVICES"
            ],
            "role": "ADMIN"
        }
    
    # Map UserRole enum to role name
    role_name_map = {
        "admin": "ADMIN",
        "reception": "RECEPTION",
        "salesman": "SALESMAN",
        "service_engineer": "SERVICE_ENGINEER",
        "customer": "CUSTOMER"
    }
    
    role_name = role_name_map.get(current_user.role.value, "CUSTOMER")
    
    from sqlalchemy import text
    # Get role_id from role name
    role_result = db.execute(
        text("SELECT id FROM roles WHERE role_name = :role_name"),
        {"role_name": role_name}
    ).fetchone()
    
    if not role_result:
        return {"permissions": []}
    
    role_id = role_result[0]
    
    # Get permissions for this role
    permissions = db.execute(
        text("SELECT permission_code FROM role_permissions WHERE role_id = :role_id"),
        {"role_id": role_id}
    ).fetchall()
    
    return {
        "permissions": [p[0] for p in permissions],
        "role": role_name
    }
