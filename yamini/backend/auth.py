from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
import logging
import models
import schemas
from database import get_db
import bcrypt

# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "FATAL: JWT_SECRET_KEY environment variable is not set. "
        "Set it in your .env file before starting the server."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Configure pwd_context (kept for potential other use)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify using bcrypt directly to avoid passlib backend detection issues on some platforms."""
    if isinstance(plain_password, str):
        plain_pw_bytes = plain_password.encode('utf-8')
    else:
        plain_pw_bytes = plain_password

    # Bcrypt has a 72-byte limit
    if len(plain_pw_bytes) > 72:
        plain_pw_bytes = plain_pw_bytes[:72]

    try:
        return bcrypt.checkpw(plain_pw_bytes, hashed_password.encode('utf-8'))
    except Exception as e:
        # Fall back to passlib if bcrypt direct fails (keep safe error log)
        print(f"ERROR: bcrypt.checkpw failed: {e}")
        return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    # Bcrypt has a 72-byte limit on passwords
    pw_bytes = password.encode('utf-8')
    if len(pw_bytes) > 72:
        pw_bytes = pw_bytes[:72]
    # Use bcrypt directly to avoid passlib backend issues
    hashed = bcrypt.hashpw(pw_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return False
    if not getattr(user, 'is_active', True):
        return False  # Deleted / deactivated employee
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    if not getattr(user, 'is_active', True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated. Contact admin.",
        )
    
    return user

async def get_current_user_optional(
    token: str = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """Get current user if authenticated, None otherwise (for public endpoints)"""
    if not token:
        return None
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    user = db.query(models.User).filter(models.User.username == username).first()
    return user

# 🔒 SALESPERSON DISCIPLINE ENFORCEMENT

async def require_attendance_today(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enforce attendance check for salesmen.
    Blocks all work-related actions if attendance not marked today.
    Marks attendance as LATE if checked in after 9:30 AM.
    """
    if current_user.role != models.UserRole.SALESMAN:
        # Only enforce for salesmen
        return current_user
    
    from datetime import date, time
    today = date.today()
    
    # Check if attendance exists for today
    attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.id,
        models.Attendance.date >= datetime.combine(today, datetime.min.time()),
        models.Attendance.date < datetime.combine(today, datetime.max.time())
    ).first()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="⏰ Attendance not marked – work access blocked. Please mark attendance first."
        )
    
    # Store attendance in current_user for access in routes
    current_user.today_attendance = attendance
    
    return current_user

def check_late_attendance(check_in_time: datetime) -> str:
    """
    Check if attendance is late (after 9:30 AM)
    Returns: 'ON_TIME', 'LATE'
    """
    from datetime import time
    late_threshold = time(9, 30)  # 9:30 AM
    
    check_in_time_only = check_in_time.time()
    
    if check_in_time_only > late_threshold:
        return 'LATE'
    return 'ON_TIME'

def block_salesman_actions(action_name: str):
    """
    Decorator/dependency to block specific actions for salesmen.
    Used for: create_invoice, approve_order, update_stock, view_mif
    """
    def dependency(current_user: models.User = Depends(get_current_user)):
        if current_user.role == models.UserRole.SALESMAN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"🚫 Salesmen cannot {action_name}"
            )
        return current_user
    return dependency

def check_permission(user: models.User, permission: str) -> bool:
    """Check if user has specific permission - DEPRECATED, use check_resource_permission"""
    
    permissions = {
        models.UserRole.ADMIN: {
            "access_mif": True,
            "view_all_customers": True,
            "manage_employees": True,
            "manage_reception": True,
            "view_reports": True,
            "manage_products": True,
            "manage_services": True,
            "view_financials": True,
            "create_invoice": True,
            "approve_orders": True,
            "update_stock": True,
        },
        models.UserRole.RECEPTION: {
            "access_mif": "READ_ONLY",  # VIEW ONLY per matrix
            "view_all_customers": True,
            "manage_employees": False,
            "manage_reception": True,
            "view_reports": True,  # Collection/monitoring only
            "manage_products": False,
            "manage_services": False,
            "view_financials": "READ_ONLY",  # Summary only
            "create_invoice": False,  # CANNOT create invoices
            "approve_orders": False,  # CANNOT approve orders
            "update_stock": False,  # CANNOT change stock
        },
        models.UserRole.SALESMAN: {
            "access_mif": False,
            "view_all_customers": False,
            "manage_employees": False,
            "manage_reception": False,
            "view_reports": False,
            "manage_products": False,
            "manage_services": False,
            "view_financials": False,
            "create_invoice": False,
            "approve_orders": False,
            "update_stock": False,
        },
        models.UserRole.SERVICE_ENGINEER: {
            "access_mif": False,
            "view_all_customers": False,
            "manage_employees": False,
            "manage_reception": False,
            "view_reports": False,
            "manage_products": False,
            "manage_services": False,
            "view_financials": False,
            "create_invoice": False,
            "approve_orders": False,
            "update_stock": False,
        },
        models.UserRole.CUSTOMER: {
            "access_mif": False,
            "view_all_customers": False,
            "manage_employees": False,
            "manage_reception": False,
            "view_reports": False,
            "manage_products": False,
            "manage_services": False,
            "view_financials": False,
            "create_invoice": False,
            "approve_orders": False,
            "update_stock": False,
        },
    }
    
    role_permissions = permissions.get(user.role, {})
    return role_permissions.get(permission, False)

def require_permission(permission: str):
    """Decorator to require specific permission"""
    def permission_checker(current_user: models.User = Depends(get_current_user)):
        if not check_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission}"
            )
        return current_user
    return permission_checker

def require_mif_access(current_user: models.User = Depends(get_current_user)):
    """Require MIF access permission (Admin full, Reception read-only)"""
    if current_user.role == models.UserRole.ADMIN:
        return current_user  # Full access
    elif current_user.role == models.UserRole.RECEPTION:
        return current_user  # Read-only access (enforced at route level)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MIF access denied. Only Admin and Reception can access MIF data."
        )

# ============================================================================
# PHASE 3: ENHANCED RBAC - RESOURCE-ACTION PERMISSION MATRIX
# ============================================================================

def check_resource_permission(user: models.User, resource: str, action: str) -> bool:
    """
    Granular permission checker based on resource-action matrix
    
    Resources: order, product, enquiry, mif, stock, invoice, report
    Actions: read, write, approve, delete
    
    Returns True if user has permission, False otherwise
    """
    
    # Permission matrix aligned with MASTER ROLE MATRIX
    PERMISSION_MATRIX = {
        models.UserRole.ADMIN: {
            'order': ['read', 'write', 'approve', 'delete'],
            'product': ['read', 'write', 'delete'],
            'enquiry': ['read', 'write', 'assign', 'delete'],
            'mif': ['read', 'write', 'delete'],
            'stock': ['read', 'write'],
            'invoice': ['read', 'write'],
            'report': ['read', 'write'],
            'notification': ['read', 'write', 'send'],
            'user': ['read', 'write', 'delete'],
        },
        models.UserRole.RECEPTION: {
            'order': ['read'],  # View only, NO approve
            'product': ['read'],  # View only, NO edit
            'enquiry': ['read', 'write', 'assign'],  # Can create & assign
            'mif': ['read'],  # VIEW ONLY per matrix
            'stock': ['read'],  # View only, NO updates
            'invoice': ['read'],  # View only, NO create
            'report': ['read'],  # Collection/monitoring only
            'notification': ['read', 'send'],
            'user': ['read'],
        },
        models.UserRole.SALESMAN: {
            'order': ['read', 'write'],  # Create only, NO approve
            'product': ['read'],  # Public view only
            'enquiry': ['read', 'write'],  # Only assigned enquiries
            'mif': [],  # NO ACCESS
            'stock': [],  # NO ACCESS to cost/profit
            'invoice': [],  # NO ACCESS
            'report': ['write'],  # Submit daily reports only
            'notification': ['read'],
            'user': [],
        },
        models.UserRole.SERVICE_ENGINEER: {
            'order': [],
            'product': ['read'],
            'enquiry': [],
            'mif': [],
            'stock': [],
            'invoice': [],
            'report': ['write'],  # Service reports only
            'notification': ['read'],
            'user': [],
        },
        models.UserRole.CUSTOMER: {
            'order': ['read'],  # Own orders only
            'product': ['read'],  # Public catalog only
            'enquiry': ['write'],  # Can create enquiries
            'mif': [],
            'stock': [],
            'invoice': ['read'],  # Own invoices only
            'report': [],
            'notification': ['read'],
            'user': [],
        },
    }
    
    role_permissions = PERMISSION_MATRIX.get(user.role, {})
    resource_permissions = role_permissions.get(resource, [])
    return action in resource_permissions


def require_resource_permission(resource: str, action: str):
    """Dependency to enforce resource-action permission"""
    def permission_checker(current_user: models.User = Depends(get_current_user)):
        if not check_resource_permission(current_user, resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {action.upper()} access to {resource} not allowed for {current_user.role.value}"
            )
        return current_user
    return permission_checker


# Specific permission checkers for common operations
def require_order_approval(current_user: models.User = Depends(get_current_user)):
    """Require order approval permission (Admin only per matrix)"""
    if not check_resource_permission(current_user, 'order', 'approve'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Order approval denied. Only Admin can approve orders."
        )
    return current_user
    return current_user


def require_stock_write(current_user: models.User = Depends(get_current_user)):
    """Require stock write permission (Admin only per matrix)"""
    if not check_resource_permission(current_user, 'stock', 'write'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Stock update denied. Only Admin can update stock."
        )
    return current_user


def require_product_write(current_user: models.User = Depends(get_current_user)):
    """Require product write permission (Admin only per matrix)"""
    if not check_resource_permission(current_user, 'product', 'write'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Product modification denied. Only Admin can modify products."
        )
    return current_user


def require_enquiry_write(current_user: models.User = Depends(get_current_user)):
    """Require enquiry write permission (Admin + Reception per matrix)"""
    if not check_resource_permission(current_user, 'enquiry', 'write'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enquiry modification denied. Only Admin and Reception can modify enquiries."
        )
    return current_user


def filter_enquiries_by_role(user: models.User, query):
    """Filter enquiries based on user role - Salesman sees only assigned"""
    if user.role == models.UserRole.SALESMAN:
        # Salesman can only see enquiries assigned to them
        return query.filter(models.Enquiry.assigned_to == user.id)
    elif user.role in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        # Admin and Reception see all enquiries
        return query
    else:
        # Other roles see nothing
        return query.filter(models.Enquiry.id == -1)


def require_mif_write(current_user: models.User = Depends(get_current_user)):
    """Require MIF write access (Admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MIF write access denied. Only Admin can create or update MIF records."
        )
    return current_user

# ============================================================================
# PHASE 3: GRANULAR PERMISSION FUNCTIONS (Resource-Specific RBAC)
# ============================================================================

def require_stock_write(current_user: models.User = Depends(get_current_user)):
    """Require stock update permission (Admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Stock update denied. Only Admin can modify stock quantities."
        )
    return current_user

def require_product_write(current_user: models.User = Depends(get_current_user)):
    """Require product write permission (Admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Product management denied. Only Admin can create or update products."
        )
    return current_user

def require_enquiry_write(current_user: models.User = Depends(get_current_user)):
    """Require enquiry write permission (Admin + Reception)"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enquiry management denied. Only Admin and Reception can manage enquiries."
        )
    return current_user

def check_enquiry_access(current_user: models.User, enquiry, db: Session):
    """Check if user can access specific enquiry"""
    if current_user.role in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        return True  # Full access
    elif current_user.role == models.UserRole.SALESMAN:
        return enquiry.assigned_to == current_user.id  # Only assigned enquiries
    return False


# ============================================
# ADMIN PERMISSION SYSTEM (NEW)
# ============================================

# Define admin permissions per module
ADMIN_PERMISSIONS = {
    "employees": ["create", "edit", "disable", "activate", "reset_password", "mark_attendance"],
    "products": ["create", "edit", "toggle", "disable"],
    "stock": ["in", "out", "correct", "view"],
    "enquiries": ["assign", "reassign", "change_priority"],
    "orders": ["create", "edit", "approve", "reject", "status", "correct"],
    "invoices": ["create", "edit", "export", "view"],
    "outstanding": ["create", "update", "track"],
    "service": ["assign", "reassign", "view_sla", "view_feedback"],
    "mif": ["create", "edit"],
    "attendance": ["view", "correct", "approve", "mark"],
    "reports": ["view", "compare", "export"],
    "audit": ["view", "filter"],
    "settings": ["manage_roles", "configure"],
}

def admin_can(module: str, action: str) -> bool:
    """Check if action is allowed for admin in module"""
    return action in ADMIN_PERMISSIONS.get(module, [])


async def require_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Require user to be admin"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def require_admin_or_reception(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Require user to be admin or reception"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Reception access required"
        )
    return current_user


def verify_admin_action(user: models.User, module: str, action: str):
    """Verify if admin can perform specific action"""
    if user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    if not admin_can(module, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin cannot perform '{action}' on '{module}'"
        )
    
    return True

