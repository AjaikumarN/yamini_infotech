"""
Audit Trail Logger
Logs all critical operations for compliance and tracking
"""

from sqlalchemy.orm import Session
from models import AuditLog
from datetime import datetime
import json
from typing import Any, Dict, Optional


def log_action(
    db: Session,
    user_id: int,
    username: str,
    action: str,
    module: str,
    record_id: str,
    record_type: str,
    changes: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    """
    Log an action to the audit trail
    
    Args:
        db: Database session
        user_id: ID of the user performing the action
        username: Username of the user
        action: Action performed (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT)
        module: Module name (Enquiry, MIF, Complaint, Customer, etc.)
        record_id: ID of the record affected
        record_type: Type of record
        changes: Dictionary of changes made (for UPDATE actions)
        ip_address: IP address of the user
    """
    try:
        audit_log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            module=module,
            record_id=str(record_id),
            record_type=record_type,
            changes=json.dumps(changes) if changes else None,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        
        db.add(audit_log)
        db.commit()
        
        return True
        
    except Exception as e:
        print(f"Error logging audit action: {str(e)}")
        db.rollback()
        return False


def log_login(db: Session, user_id: int, username: str, ip_address: str, success: bool = True):
    """Log user login attempt"""
    log_action(
        db=db,
        user_id=user_id,
        username=username,
        action="LOGIN" if success else "FAILED_LOGIN",
        module="Authentication",
        record_id=str(user_id),
        record_type="User",
        ip_address=ip_address
    )


def log_logout(db: Session, user_id: int, username: str, ip_address: str):
    """Log user logout"""
    log_action(
        db=db,
        user_id=user_id,
        username=username,
        action="LOGOUT",
        module="Authentication",
        record_id=str(user_id),
        record_type="User",
        ip_address=ip_address
    )


def log_create(db: Session, user_id: int, username: str, module: str, 
               record_id: str, record_type: str, ip_address: str = None):
    """Log record creation"""
    log_action(
        db=db,
        user_id=user_id,
        username=username,
        action="CREATE",
        module=module,
        record_id=record_id,
        record_type=record_type,
        ip_address=ip_address
    )


def log_update(db: Session, user_id: int, username: str, module: str,
               record_id: str, record_type: str, changes: Dict[str, Any],
               ip_address: str = None):
    """Log record update"""
    log_action(
        db=db,
        user_id=user_id,
        username=username,
        action="UPDATE",
        module=module,
        record_id=record_id,
        record_type=record_type,
        changes=changes,
        ip_address=ip_address
    )


def log_delete(db: Session, user_id: int, username: str, module: str,
               record_id: str, record_type: str, ip_address: str = None):
    """Log record deletion"""
    log_action(
        db=db,
        user_id=user_id,
        username=username,
        action="DELETE",
        module=module,
        record_id=record_id,
        record_type=record_type,
        ip_address=ip_address
    )


def log_view(db: Session, user_id: int, username: str, module: str,
             record_id: str, record_type: str, ip_address: str = None):
    """Log record view (for confidential data like MIF)"""
    log_action(
        db=db,
        user_id=user_id,
        username=username,
        action="VIEW",
        module=module,
        record_id=record_id,
        record_type=record_type,
        ip_address=ip_address
    )


def get_audit_logs(db: Session, module: str = None, user_id: int = None, 
                   action: str = None, limit: int = 100):
    """
    Retrieve audit logs with filters
    
    Args:
        db: Database session
        module: Filter by module name
        user_id: Filter by user ID
        action: Filter by action type
        limit: Maximum number of logs to return
    
    Returns:
        List of audit log records
    """
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    
    if module:
        query = query.filter(AuditLog.module == module)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    return query.limit(limit).all()


def get_record_history(db: Session, module: str, record_id: str):
    """
    Get complete history of a specific record
    
    Args:
        db: Database session
        module: Module name
        record_id: ID of the record
    
    Returns:
        List of all audit logs for that record
    """
    return db.query(AuditLog).filter(
        AuditLog.module == module,
        AuditLog.record_id == str(record_id)
    ).order_by(AuditLog.timestamp.desc()).all()
