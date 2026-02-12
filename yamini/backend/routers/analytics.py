"""
Engineer Performance Analytics Router
Provides derived analytics for service engineers and admin
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from database import get_db
from auth import get_current_user
from models import User, UserRole, Complaint, Feedback, Attendance, ServiceEngineerDailyReport
from datetime import datetime, timedelta, date
from typing import Optional, List
from sla_utils import get_engineer_sla_stats, calculate_sla_status

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ============================================
# ENGINEER SELF-ANALYTICS (RBAC: Engineer only sees own data)
# ============================================

@router.get("/my-performance")
def get_my_performance(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get performance analytics for logged-in engineer
    RBAC: SERVICE_ENGINEER can only see their own data
    """
    if current_user.role != UserRole.SERVICE_ENGINEER:
        raise HTTPException(status_code=403, detail="Access denied. Service engineers only.")
    
    # Parse dates
    if start_date:
        start = datetime.fromisoformat(start_date)
    else:
        start = datetime.utcnow() - timedelta(days=30)  # Last 30 days
    
    if end_date:
        end = datetime.fromisoformat(end_date)
    else:
        end = datetime.utcnow()
    
    # Get jobs assigned to this engineer
    jobs_query = db.query(Complaint).filter(
        Complaint.assigned_to == current_user.id,
        Complaint.created_at >= start,
        Complaint.created_at <= end
    )
    
    jobs = jobs_query.all()
    total_jobs = len(jobs)
    completed_jobs = [j for j in jobs if j.status == 'COMPLETED']
    completed_count = len(completed_jobs)
    
    # Calculate resolution time
    resolution_times = []
    for job in completed_jobs:
        if job.completed_at and job.created_at:
            delta = job.completed_at - job.created_at
            resolution_times.append(delta.total_seconds() / 3600)  # hours
    
    avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
    
    # SLA Stats
    sla_stats = get_engineer_sla_stats(db, current_user.id, start, end)
    
    # Customer ratings
    feedbacks = db.query(Feedback).join(Complaint).filter(
        Complaint.assigned_to == current_user.id,
        Feedback.created_at >= start,
        Feedback.created_at <= end
    ).all()
    
    ratings = [f.rating for f in feedbacks if f.rating]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    negative_feedback_count = sum(1 for f in feedbacks if f.is_negative)
    
    # Attendance
    attendance_records = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        Attendance.date >= start.date(),
        Attendance.date <= end.date()
    ).all()
    
    total_days = (end.date() - start.date()).days + 1
    present_days = sum(1 for a in attendance_records if a.status == 'Present')
    attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
    
    # Daily report discipline
    daily_reports = db.query(ServiceEngineerDailyReport).filter(
        ServiceEngineerDailyReport.engineer_id == current_user.id,
        ServiceEngineerDailyReport.report_date >= start.date(),
        ServiceEngineerDailyReport.report_date <= end.date()
    ).all()
    
    report_submission_rate = (len(daily_reports) / total_days * 100) if total_days > 0 else 0
    
    # Repeat complaints (same customer + machine within timeframe)
    repeat_complaints = 0
    customer_machine_map = {}
    for job in sorted(jobs, key=lambda x: x.created_at):
        key = f"{job.customer_id}_{job.machine_model}"
        if key in customer_machine_map:
            repeat_complaints += 1
        customer_machine_map[key] = job.id
    
    # Calculate performance score
    completion_rate = (completed_count / total_jobs * 100) if total_jobs > 0 else 100
    performance_score = (
        (completion_rate * 0.30) +
        (sla_stats['compliance_percentage'] * 0.30) +
        (attendance_percentage * 0.20) +
        (avg_rating / 5 * 100 * 0.20)
    )
    
    return {
        "engineer_id": current_user.id,
        "engineer_name": current_user.full_name,
        "period": {
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "days": total_days
        },
        "job_stats": {
            "total_assigned": total_jobs,
            "completed": completed_count,
            "in_progress": sum(1 for j in jobs if j.status in ['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS']),
            "on_hold": sum(1 for j in jobs if j.status == 'ON_HOLD'),
            "completion_rate": round(completion_rate, 2),
            "avg_resolution_time_hours": round(avg_resolution_time, 2),
            "repeat_complaints": repeat_complaints
        },
        "sla_performance": sla_stats,
        "customer_satisfaction": {
            "total_feedbacks": len(feedbacks),
            "average_rating": round(avg_rating, 2),
            "negative_feedbacks": negative_feedback_count,
            "ratings_breakdown": {
                "5_star": sum(1 for r in ratings if r == 5),
                "4_star": sum(1 for r in ratings if r == 4),
                "3_star": sum(1 for r in ratings if r == 3),
                "2_star": sum(1 for r in ratings if r == 2),
                "1_star": sum(1 for r in ratings if r == 1)
            }
        },
        "attendance": {
            "total_days": total_days,
            "present_days": present_days,
            "attendance_percentage": round(attendance_percentage, 2)
        },
        "daily_reports": {
            "submitted": len(daily_reports),
            "expected": total_days,
            "submission_rate": round(report_submission_rate, 2)
        },
        "performance_score": round(performance_score, 2)
    }


# ============================================
# ADMIN ANALYTICS (RBAC: Admin only)
# ============================================

@router.get("/admin/engineer-performance")
def get_all_engineers_performance(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    engineer_id: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get performance analytics for all engineers (Admin only)
    RBAC: ADMIN only
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Parse dates
    if start_date:
        start = datetime.fromisoformat(start_date)
    else:
        start = datetime.utcnow() - timedelta(days=30)
    
    if end_date:
        end = datetime.fromisoformat(end_date)
    else:
        end = datetime.utcnow()
    
    # Get all service engineers or specific engineer
    engineers_query = db.query(User).filter(User.role == UserRole.SERVICE_ENGINEER)
    if engineer_id:
        engineers_query = engineers_query.filter(User.id == engineer_id)
    
    engineers = engineers_query.all()
    
    results = []
    
    for engineer in engineers:
        # Get jobs for this engineer
        jobs_query = db.query(Complaint).filter(
            Complaint.assigned_to == engineer.id,
            Complaint.created_at >= start,
            Complaint.created_at <= end
        )
        
        if priority:
            jobs_query = jobs_query.filter(Complaint.priority == priority)
        
        jobs = jobs_query.all()
        total_jobs = len(jobs)
        completed_jobs = [j for j in jobs if j.status == 'COMPLETED']
        completed_count = len(completed_jobs)
        
        # SLA Stats
        sla_stats = get_engineer_sla_stats(db, engineer.id, start, end)
        
        # Customer ratings
        feedbacks = db.query(Feedback).join(Complaint).filter(
            Complaint.assigned_to == engineer.id,
            Feedback.created_at >= start,
            Feedback.created_at <= end
        ).all()
        
        ratings = [f.rating for f in feedbacks if f.rating]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        # Attendance
        attendance_records = db.query(Attendance).filter(
            Attendance.employee_id == engineer.id,
            Attendance.date >= start.date(),
            Attendance.date <= end.date(),
            Attendance.status == 'Present'
        ).count()
        
        total_days = (end.date() - start.date()).days + 1
        attendance_percentage = (attendance_records / total_days * 100) if total_days > 0 else 0
        
        # Performance score
        completion_rate = (completed_count / total_jobs * 100) if total_jobs > 0 else 100
        performance_score = (
            (completion_rate * 0.30) +
            (sla_stats['compliance_percentage'] * 0.30) +
            (attendance_percentage * 0.20) +
            (avg_rating / 5 * 100 * 0.20)
        )
        
        results.append({
            "engineer_id": engineer.id,
            "engineer_name": engineer.full_name,
            "email": engineer.email,
            "jobs_assigned": total_jobs,
            "jobs_completed": completed_count,
            "completion_rate": round(completion_rate, 2),
            "sla_compliance": round(sla_stats['compliance_percentage'], 2),
            "sla_breaches": sla_stats['sla_breached'],
            "average_rating": round(avg_rating, 2),
            "total_feedbacks": len(feedbacks),
            "attendance_percentage": round(attendance_percentage, 2),
            "performance_score": round(performance_score, 2)
        })
    
    # Sort by performance score
    results.sort(key=lambda x: x['performance_score'], reverse=True)
    
    return {
        "period": {
            "start_date": start.isoformat(),
            "end_date": end.isoformat()
        },
        "total_engineers": len(results),
        "engineers": results
    }


@router.get("/admin/sla-status")
def get_sla_status(
    status: Optional[str] = Query(None, description="Filter by: ok, warning, breached"),
    priority: Optional[str] = Query(None),
    engineer_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current SLA status for all active service requests (Admin/Reception)
    RBAC: ADMIN, RECEPTION
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Admin or Reception access required")
    
    # Get all active service requests
    query = db.query(Complaint).filter(
        Complaint.status.in_(['ASSIGNED', 'ON_THE_WAY', 'IN_PROGRESS'])
    )
    
    if priority:
        query = query.filter(Complaint.priority == priority)
    
    if engineer_id:
        query = query.filter(Complaint.assigned_to == engineer_id)
    
    complaints = query.all()
    
    results = []
    stats = {
        'ok': 0,
        'warning': 0,
        'breached': 0,
        'paused': 0
    }
    
    for complaint in complaints:
        sla_status = calculate_sla_status(complaint)
        
        # Filter by status if requested
        if status and sla_status['status'] != status:
            continue
        
        stats[sla_status['status']] = stats.get(sla_status['status'], 0) + 1
        
        results.append({
            "ticket_no": complaint.ticket_no,
            "customer_name": complaint.customer_name,
            "priority": complaint.priority,
            "status": complaint.status,
            "engineer_name": complaint.assigned_engineer.full_name if complaint.assigned_engineer else "Unassigned",
            "engineer_id": complaint.assigned_to,
            "created_at": complaint.created_at.isoformat(),
            "sla_status": sla_status['status'],
            "sla_due_time": sla_status['sla_due_time'].isoformat() if sla_status['sla_due_time'] else None,
            "remaining_hours": sla_status['remaining_hours'],
            "percentage_remaining": sla_status['percentage_remaining']
        })
    
    # Sort by remaining time (most urgent first)
    results.sort(key=lambda x: x['remaining_hours'] if x['remaining_hours'] else 0)
    
    return {
        "total_active_jobs": len(results),
        "stats": stats,
        "jobs": results
    }


@router.get("/admin/sla-summary")
def get_sla_daily_summary(
    date_param: Optional[str] = Query(None, alias="date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily SLA summary for admin dashboard
    RBAC: ADMIN only
    """
    from datetime import date as date_module
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if date_param:
        target_date = datetime.fromisoformat(date_param).date()
    else:
        target_date = date_module.today()
    
    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())
    
    # Get all jobs for the day
    jobs = db.query(Complaint).filter(
        Complaint.created_at >= start_datetime,
        Complaint.created_at <= end_datetime
    ).all()
    
    total = len(jobs)
    completed = sum(1 for j in jobs if j.status == 'COMPLETED')
    breached = sum(1 for j in jobs if j.sla_breach_sent)
    warnings = sum(1 for j in jobs if j.sla_warning_sent and not j.sla_breach_sent)
    
    return {
        "date": target_date.isoformat(),
        "total_jobs": total,
        "completed": completed,
        "in_progress": total - completed,
        "sla_warnings": warnings,
        "sla_breaches": breached,
        "compliance_rate": round(((total - breached) / total * 100) if total > 0 else 100, 2)
    }


@router.get("/dashboard")
def get_admin_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get analytics for admin dashboard
    RBAC: ADMIN and RECEPTION
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Admin or Reception access required")
    
    # Sales Analytics
    from models import Enquiry, Order
    enquiries = db.query(Enquiry).all()
    orders = db.query(Order).all()
    
    sales_analytics = {
        "total_enquiries": len(enquiries),
        "converted": len([e for e in enquiries if e.status == 'CONVERTED']),
        "pending": len([e for e in enquiries if e.status in ['NEW', 'PENDING', 'CONTACTED', 'QUALIFIED']])
    }
    
    # Service Analytics
    service_requests = db.query(Complaint).all()
    service_analytics = {
        "total_requests": len(service_requests),
        "completed": len([s for s in service_requests if s.status == 'COMPLETED']),
        "pending": len([s for s in service_requests if s.status != 'COMPLETED']),
        "sla_breached": len([s for s in service_requests if s.sla_breach_sent])
    }
    
    # Attendance Analytics
    today = date.today()
    attendance_records = db.query(Attendance).filter(
        func.date(Attendance.date) == today
    ).all()
    
    total_staff = db.query(User).filter(
        User.is_active == True,
        User.role.in_([UserRole.SALESMAN, UserRole.SERVICE_ENGINEER, UserRole.RECEPTION])
    ).count()
    
    attendance_analytics = {
        "total_staff": total_staff,
        "present_today": len([a for a in attendance_records if a.status in ['Present', 'On Time']]),
        "late_today": len([a for a in attendance_records if a.status == 'Late'])
    }
    
    return {
        "sales": sales_analytics,
        "service": service_analytics,
        "attendance": attendance_analytics
    }
