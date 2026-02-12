"""
Audit Logs Router
View audit trail of all system actions
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import AuditLog, User, UserRole
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit Logs"]
)


# Schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    username: str
    action: str
    module: str
    record_id: str
    record_type: str
    changes: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    module: Optional[str] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit logs (Admin and Reception only)"""
    
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and reception can view audit logs"
        )
    
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    
    if module:
        query = query.filter(AuditLog.module == module)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    logs = query.limit(limit).all()
    
    return logs


@router.get("/logs/record/{module}/{record_id}", response_model=List[AuditLogResponse])
def get_record_history(
    module: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete history of a specific record (Admin and Reception only)"""
    
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and reception can view audit logs"
        )
    
    logs = db.query(AuditLog).filter(
        AuditLog.module == module,
        AuditLog.record_id == record_id
    ).order_by(AuditLog.timestamp.desc()).all()
    
    return logs


@router.get("/stats")
def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit statistics (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view audit statistics"
        )
    
    total_logs = db.query(AuditLog).count()
    
    # Count by action
    actions = db.query(
        AuditLog.action, 
        func.count(AuditLog.id)
    ).group_by(AuditLog.action).all()
    
    # Count by module
    modules = db.query(
        AuditLog.module,
        func.count(AuditLog.id)
    ).group_by(AuditLog.module).all()
    
    # Top users by activity
    top_users = db.query(
        AuditLog.username,
        func.count(AuditLog.id).label('count')
    ).group_by(AuditLog.username).order_by(func.count(AuditLog.id).desc()).limit(10).all()
    
    return {
        "total_logs": total_logs,
        "actions": [{"action": a[0], "count": a[1]} for a in actions],
        "modules": [{"module": m[0], "count": m[1]} for m in modules],
        "top_users": [{"username": u[0], "count": u[1]} for u in top_users]
    }


@router.get("/recent-activity")
def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent system activity for dashboard"""
    
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get recent audit logs
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    # Map actions to icons and colors
    action_map = {
        "CREATE": {"icon": "add_circle", "color": "#10b981"},
        "UPDATE": {"icon": "edit", "color": "#3b82f6"},
        "DELETE": {"icon": "delete", "color": "#ef4444"},
        "LOGIN": {"icon": "login", "color": "#8b5cf6"},
        "LOGOUT": {"icon": "logout", "color": "#6b7280"},
        "ASSIGN": {"icon": "person_add", "color": "#f59e0b"},
        "COMPLETE": {"icon": "check_circle", "color": "#10b981"},
        "APPROVE": {"icon": "verified", "color": "#10b981"},
    }
    
    module_map = {
        "EMPLOYEE": {"icon": "person_add", "text": "Employee"},
        "USER": {"icon": "person_add", "text": "User"},
        "ORDER": {"icon": "shopping_cart", "text": "Order"},
        "SERVICE": {"icon": "build", "text": "Service"},
        "STOCK": {"icon": "inventory", "text": "Stock"},
        "PRODUCT": {"icon": "inventory_2", "text": "Product"},
        "ENQUIRY": {"icon": "question_answer", "text": "Enquiry"},
        "INVOICE": {"icon": "receipt", "text": "Invoice"},
        "ATTENDANCE": {"icon": "schedule", "text": "Attendance"},
    }
    
    activities = []
    for log in logs:
        module_info = module_map.get(log.module, {"icon": "info", "text": log.module})
        action_info = action_map.get(log.action, {"icon": "info", "color": "#6b7280"})
        
        # Calculate time ago
        now = datetime.utcnow()
        diff = now - log.timestamp
        if diff.seconds < 60:
            time_ago = f"{diff.seconds}s ago"
        elif diff.seconds < 3600:
            time_ago = f"{diff.seconds // 60}m ago"
        elif diff.seconds < 86400:
            time_ago = f"{diff.seconds // 3600}h ago"
        else:
            time_ago = f"{diff.days}d ago"
        
        # Build activity text
        text = f"{log.action.capitalize()} {module_info['text'].lower()}"
        if log.record_id:
            text += f" #{log.record_id}"
        
        activities.append({
            "icon": module_info["icon"],
            "text": text,
            "time": time_ago,
            "color": action_info["color"],
            "username": log.username
        })
    
    return activities
