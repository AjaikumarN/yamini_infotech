from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from typing import List, Optional
from datetime import datetime, timedelta, date
import schemas
import models
import auth
from database import get_db

router = APIRouter(prefix="/api/admin/sales-performance", tags=["Admin Sales Performance"])

@router.get("/", response_model=List[schemas.SalesmanPerformance])
def get_salesman_performance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[int] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get performance metrics for all salesmen - Admin and Reception only"""
    
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Only admin and reception can view sales performance")
    
    # Get all salesmen
    salesmen = db.query(models.User).filter(models.User.role == models.UserRole.SALESMAN).all()
    
    performance_data = []
    
    for salesman in salesmen:
        # Base query for enquiries
        enquiry_query = db.query(models.Enquiry).filter(models.Enquiry.assigned_to == salesman.id)
        
        # Apply filters
        if start_date:
            enquiry_query = enquiry_query.filter(models.Enquiry.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            enquiry_query = enquiry_query.filter(models.Enquiry.created_at <= datetime.fromisoformat(end_date))
        if product_id:
            enquiry_query = enquiry_query.filter(models.Enquiry.product_id == product_id)
        if priority:
            enquiry_query = enquiry_query.filter(models.Enquiry.priority == priority)
        
        # Get counts
        assigned = enquiry_query.count()
        converted = enquiry_query.filter(models.Enquiry.status == "CONVERTED").count()
        lost = enquiry_query.filter(models.Enquiry.status == "LOST").count()
        
        # Get revenue (from approved orders)
        revenue_query = db.query(func.sum(models.Order.total_amount)).join(
            models.Enquiry, models.Order.enquiry_id == models.Enquiry.id
        ).filter(
            models.Enquiry.assigned_to == salesman.id,
            models.Order.status == "APPROVED"
        )
        
        if start_date:
            revenue_query = revenue_query.filter(models.Order.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            revenue_query = revenue_query.filter(models.Order.created_at <= datetime.fromisoformat(end_date))
        
        revenue = revenue_query.scalar() or 0
        
        # Calculate conversion rate
        conversion_rate = (converted / assigned * 100) if assigned > 0 else 0
        
        # Calculate average closing days
        converted_enquiries = enquiry_query.filter(models.Enquiry.status == "CONVERTED").all()
        avg_closing_days = 0
        if converted_enquiries:
            total_days = sum([(e.last_follow_up or e.created_at) - e.created_at for e in converted_enquiries], timedelta()).days
            avg_closing_days = total_days / len(converted_enquiries) if len(converted_enquiries) > 0 else 0
        
        # Get visit count
        visit_count = db.query(models.ShopVisit).filter(
            models.ShopVisit.salesman_id == salesman.id
        ).count()
        
        # Get missed followups
        missed_followups = db.query(models.SalesFollowUp).filter(
            models.SalesFollowUp.salesman_id == salesman.id,
            models.SalesFollowUp.status == "Pending",
            models.SalesFollowUp.followup_date < datetime.utcnow()
        ).count()
        
        performance_data.append({
            "salesman_id": salesman.id,
            "salesman_name": salesman.full_name or salesman.username,
            "assigned": assigned,
            "converted": converted,
            "conversion_rate": round(conversion_rate, 2),
            "revenue": revenue,
            "avg_closing_days": round(avg_closing_days, 2),
            "missed_followups": missed_followups,
            "visit_count": visit_count,
            "lost_count": lost
        })
    
    return performance_data

@router.get("/funnel", response_model=schemas.SalesFunnelData)
def get_sales_funnel(
    salesman_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get sales funnel data - Admin and Reception only"""
    
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Only admin and reception can view sales funnel")
    
    query = db.query(models.Enquiry)
    
    # Filter by salesman if specified
    if salesman_id:
        query = query.filter(models.Enquiry.assigned_to == salesman_id)
    
    # Apply date filters
    if start_date:
        query = query.filter(models.Enquiry.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Enquiry.created_at <= datetime.fromisoformat(end_date))
    
    # Count by status
    new = query.filter(models.Enquiry.status == "NEW").count()
    contacted = query.filter(models.Enquiry.status == "CONTACTED").count()
    followup = query.filter(models.Enquiry.status == "FOLLOW_UP").count()
    quoted = query.filter(models.Enquiry.status == "QUOTED").count()
    converted = query.filter(models.Enquiry.status == "CONVERTED").count()
    lost = query.filter(models.Enquiry.status == "LOST").count()
    
    return {
        "new": new,
        "contacted": contacted,
        "followup": followup,
        "quoted": quoted,
        "converted": converted,
        "lost": lost
    }

@router.get("/salesman/{salesman_id}", response_model=schemas.SalesmanPerformance)
def get_single_salesman_performance(
    salesman_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get detailed performance for a specific salesman"""
    
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.OFFICE_STAFF]:
        raise HTTPException(status_code=403, detail="Only admin and office staff can view sales performance")
    
    salesman = db.query(models.User).filter(
        models.User.id == salesman_id,
        models.User.role == models.UserRole.SALESMAN
    ).first()
    
    if not salesman:
        raise HTTPException(status_code=404, detail="Salesman not found")
    
    # Build query
    enquiry_query = db.query(models.Enquiry).filter(models.Enquiry.assigned_to == salesman_id)
    
    if start_date:
        enquiry_query = enquiry_query.filter(models.Enquiry.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        enquiry_query = enquiry_query.filter(models.Enquiry.created_at <= datetime.fromisoformat(end_date))
    
    assigned = enquiry_query.count()
    converted = enquiry_query.filter(models.Enquiry.status == "CONVERTED").count()
    lost = enquiry_query.filter(models.Enquiry.status == "LOST").count()
    
    # Revenue
    revenue_query = db.query(func.sum(models.Order.total_amount)).join(
        models.Enquiry, models.Order.enquiry_id == models.Enquiry.id
    ).filter(
        models.Enquiry.assigned_to == salesman_id,
        models.Order.status == "APPROVED"
    )
    
    if start_date:
        revenue_query = revenue_query.filter(models.Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        revenue_query = revenue_query.filter(models.Order.created_at <= datetime.fromisoformat(end_date))
    
    revenue = revenue_query.scalar() or 0
    
    conversion_rate = (converted / assigned * 100) if assigned > 0 else 0
    
    # Average closing days
    converted_enquiries = enquiry_query.filter(models.Enquiry.status == "CONVERTED").all()
    avg_closing_days = 0
    if converted_enquiries:
        total_days = sum([(e.last_follow_up or e.created_at) - e.created_at for e in converted_enquiries], timedelta()).days
        avg_closing_days = total_days / len(converted_enquiries) if len(converted_enquiries) > 0 else 0
    
    visit_count = db.query(models.ShopVisit).filter(models.ShopVisit.salesman_id == salesman_id).count()
    
    missed_followups = db.query(models.SalesFollowUp).filter(
        models.SalesFollowUp.salesman_id == salesman_id,
        models.SalesFollowUp.status == "Pending",
        models.SalesFollowUp.followup_date < datetime.utcnow()
    ).count()
    
    return {
        "salesman_id": salesman.id,
        "salesman_name": salesman.full_name or salesman.username,
        "assigned": assigned,
        "converted": converted,
        "conversion_rate": round(conversion_rate, 2),
        "revenue": revenue,
        "avg_closing_days": round(avg_closing_days, 2),
        "missed_followups": missed_followups,
        "visit_count": visit_count,
        "lost_count": lost
    }

@router.get("/daily-reports")
def get_all_daily_reports(
    date: Optional[str] = None,
    salesman_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get revenue report - Admin and Reception only"""
    
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.RECEPTION]:
        raise HTTPException(status_code=403, detail="Only admin and reception can view revenue reports")
    
    query = db.query(models.SalesDailyReport)
    
    if date:
        report_date = datetime.fromisoformat(date).date()
        query = query.filter(models.SalesDailyReport.date == report_date)
    
    if salesman_id:
        query = query.filter(models.SalesDailyReport.salesman_id == salesman_id)
    
    return query.order_by(models.SalesDailyReport.date.desc()).all()

@router.get("/missing-reports")
def get_missing_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get salesmen who haven't submitted today's report"""
    
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.OFFICE_STAFF]:
        raise HTTPException(status_code=403, detail="Only admin and office staff can view missing reports")
    
    today = date.today()
    
    # Get all salesmen
    all_salesmen = db.query(models.User).filter(models.User.role == models.UserRole.SALESMAN).all()
    
    # Get salesmen who submitted today's report
    submitted = db.query(models.SalesDailyReport.salesman_id).filter(
        models.SalesDailyReport.date == today,
        models.SalesDailyReport.submitted == True
    ).all()
    
    submitted_ids = [s[0] for s in submitted]
    
    missing = [
        {
            "id": s.id,
            "name": s.full_name or s.username,
            "username": s.username
        }
        for s in all_salesmen if s.id not in submitted_ids
    ]
    
    return missing
