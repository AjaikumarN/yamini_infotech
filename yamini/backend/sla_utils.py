"""
SLA Calculation and Escalation Utilities
Handles SLA status computation and notification triggers
"""
from datetime import datetime, timedelta
from typing import Dict, Optional
from sqlalchemy.orm import Session
from models import Complaint, User, UserRole
from notification_service import NotificationService

# SLA Time Limits (in hours)
SLA_LIMITS = {
    "CRITICAL": 4,   # HOT
    "URGENT": 12,    # WARM
    "NORMAL": 24     # COLD
}

def calculate_sla_status(complaint: Complaint) -> Dict:
    """
    Calculate SLA status for a service request
    Returns: {
        'status': 'ok' | 'warning' | 'breached' | 'paused',
        'sla_due_time': datetime,
        'remaining_seconds': int,
        'remaining_hours': float,
        'percentage_remaining': float
    }
    """
    # If completed or on hold, SLA is paused
    if complaint.status in ['COMPLETED', 'CANCELLED']:
        return {
            'status': 'completed',
            'sla_due_time': None,
            'remaining_seconds': 0,
            'remaining_hours': 0,
            'percentage_remaining': 0
        }
    
    if complaint.status == 'ON_HOLD':
        return {
            'status': 'paused',
            'sla_due_time': complaint.sla_time,
            'remaining_seconds': 0,
            'remaining_hours': 0,
            'percentage_remaining': 0
        }
    
    # Get SLA hours based on priority
    priority = complaint.priority or "NORMAL"
    sla_hours = SLA_LIMITS.get(priority, 24)
    
    # Calculate SLA due time
    sla_due_time = complaint.created_at + timedelta(hours=sla_hours)
    
    # Calculate remaining time
    now = datetime.utcnow()
    remaining = sla_due_time - now
    remaining_seconds = int(remaining.total_seconds())
    remaining_hours = remaining_seconds / 3600
    
    # Calculate percentage remaining
    total_sla_seconds = sla_hours * 3600
    percentage_remaining = (remaining_seconds / total_sla_seconds) * 100 if total_sla_seconds > 0 else 0
    
    # Determine status
    if remaining_seconds <= 0:
        status = 'breached'
    elif percentage_remaining <= 30:
        status = 'warning'
    else:
        status = 'ok'
    
    return {
        'status': status,
        'sla_due_time': sla_due_time,
        'remaining_seconds': remaining_seconds,
        'remaining_hours': round(remaining_hours, 2),
        'percentage_remaining': round(percentage_remaining, 2)
    }


def check_and_send_sla_notifications(db: Session, notif_service: NotificationService):
    """
    Check all open service requests and send SLA notifications
    Runs every 15 minutes via scheduler
    """
    print(f"\n🔔 [{datetime.now()}] Running SLA escalation check...")
    
    # Get all open service requests
    open_complaints = db.query(Complaint).filter(
        Complaint.status.in_(['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'])
    ).all()
    
    warning_count = 0
    breach_count = 0
    
    for complaint in open_complaints:
        sla_status = calculate_sla_status(complaint)
        
        # Handle SLA Warning (30% time left)
        if sla_status['status'] == 'warning' and not complaint.sla_warning_sent:
            send_sla_warning(db, notif_service, complaint, sla_status)
            complaint.sla_warning_sent = True
            warning_count += 1
        
        # Handle SLA Breach
        elif sla_status['status'] == 'breached' and not complaint.sla_breach_sent:
            send_sla_breach(db, notif_service, complaint, sla_status)
            complaint.sla_breach_sent = True
            breach_count += 1
    
    db.commit()
    
    print(f"✅ SLA Check Complete: {warning_count} warnings, {breach_count} breaches")
    return {
        'warnings_sent': warning_count,
        'breaches_sent': breach_count,
        'total_checked': len(open_complaints)
    }


def send_sla_warning(db: Session, notif_service: NotificationService, 
                     complaint: Complaint, sla_status: Dict):
    """
    Send SLA warning notification (30% time remaining)
    Recipients: Engineer (assigned), Admin
    """
    remaining_hours = abs(sla_status['remaining_hours'])
    
    # Notify assigned engineer
    if complaint.assigned_to:
        notif_service.create_notification(
            db=db,
            user_id=complaint.assigned_to,
            title=f"⚠️ SLA Warning - Ticket #{complaint.ticket_no}",
            message=f"Only {remaining_hours:.1f} hours left to complete service. Customer: {complaint.customer_name}",
            notification_type="sla_warning",
            priority="high",
            module="service",
            action_url=f"/service-engineer/jobs"
        )
    
    # Notify all admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        notif_service.create_notification(
            db=db,
            user_id=admin.id,
            title=f"⚠️ SLA Warning - Ticket #{complaint.ticket_no}",
            message=f"Service request nearing SLA breach. Engineer: {complaint.assigned_engineer.full_name if complaint.assigned_engineer else 'Unassigned'}. {remaining_hours:.1f}h remaining.",
            notification_type="sla_warning",
            priority="high",
            module="service",
            action_url=f"/admin/service-requests/{complaint.id}"
        )
    
    print(f"  ⚠️ SLA Warning sent for Ticket #{complaint.ticket_no}")


def send_sla_breach(db: Session, notif_service: NotificationService, 
                    complaint: Complaint, sla_status: Dict):
    """
    Send SLA breach notification
    Recipients: Engineer (assigned), Reception, Admin
    """
    overdue_hours = abs(sla_status['remaining_hours'])
    
    # Notify assigned engineer
    if complaint.assigned_to:
        notif_service.create_notification(
            db=db,
            user_id=complaint.assigned_to,
            title=f"🔴 SLA BREACHED - Ticket #{complaint.ticket_no}",
            message=f"URGENT: Service request is {overdue_hours:.1f} hours overdue! Customer: {complaint.customer_name}. Take immediate action.",
            notification_type="sla_breach",
            priority="critical",
            module="service",
            action_url=f"/service-engineer/jobs"
        )
    
    # Notify all reception staff
    reception_users = db.query(User).filter(User.role == UserRole.RECEPTION).all()
    for reception in reception_users:
        notif_service.create_notification(
            db=db,
            user_id=reception.id,
            title=f"🔴 SLA BREACHED - Ticket #{complaint.ticket_no}",
            message=f"Service request overdue by {overdue_hours:.1f} hours. Customer: {complaint.customer_name}, Phone: {complaint.phone}",
            notification_type="sla_breach",
            priority="critical",
            module="service",
            action_url=f"/reception/service-complaints"
        )
    
    # Notify all admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        notif_service.create_notification(
            db=db,
            user_id=admin.id,
            title=f"🔴 SLA BREACHED - Ticket #{complaint.ticket_no}",
            message=f"CRITICAL: Service overdue by {overdue_hours:.1f}h. Engineer: {complaint.assigned_engineer.full_name if complaint.assigned_engineer else 'Unassigned'}. Priority: {complaint.priority}",
            notification_type="sla_breach",
            priority="critical",
            module="service",
            action_url=f"/admin/service-requests/{complaint.id}"
        )
    
    print(f"  🔴 SLA Breach notification sent for Ticket #{complaint.ticket_no}")


def get_engineer_sla_stats(db: Session, engineer_id: int, 
                           start_date: Optional[datetime] = None,
                           end_date: Optional[datetime] = None) -> Dict:
    """
    Calculate SLA statistics for a specific engineer
    """
    query = db.query(Complaint).filter(Complaint.assigned_to == engineer_id)
    
    if start_date:
        query = query.filter(Complaint.created_at >= start_date)
    if end_date:
        query = query.filter(Complaint.created_at <= end_date)
    
    jobs = query.all()
    
    total = len(jobs)
    breached = sum(1 for j in jobs if j.sla_breach_sent)
    warnings = sum(1 for j in jobs if j.sla_warning_sent and not j.sla_breach_sent)
    compliant = total - breached
    
    compliance_percentage = (compliant / total * 100) if total > 0 else 100
    
    return {
        'total_jobs': total,
        'sla_compliant': compliant,
        'sla_warnings': warnings,
        'sla_breached': breached,
        'compliance_percentage': round(compliance_percentage, 2)
    }
