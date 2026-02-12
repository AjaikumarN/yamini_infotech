"""
Daily Reports Router
Handles salesman daily report submission and tracking
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
from database import get_db
from models import DailyReport, User, UserRole
from auth import get_current_user, get_current_user_optional
from audit_logger import log_create, log_view
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/reports",
    tags=["Daily Reports"]
)


# Schemas
class DailyReportCreate(BaseModel):
    report_date: date
    calls_made: int = 0
    shops_visited: int = 0
    enquiries_generated: int = 0
    sales_closed: int = 0
    report_notes: str = ""


class DailyReportResponse(BaseModel):
    id: int
    salesman_id: int
    salesman_name: str
    report_date: date
    calls_made: int
    shops_visited: int
    enquiries_generated: int
    sales_closed: int
    report_notes: str
    report_submitted: bool
    submission_time: datetime | None
    
    class Config:
        from_attributes = True


# ==========================================
# ENDPOINTS
# ==========================================

@router.post("/daily", response_model=DailyReportResponse)
def submit_daily_report(
    report: DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit daily report (Salesman only)"""
    
    if current_user.role != UserRole.SALESMAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only salesmen can submit daily reports"
        )
    
    # Check if report already exists for this date
    existing_report = db.query(DailyReport).filter(
        DailyReport.salesman_id == current_user.id,
        DailyReport.report_date == report.report_date
    ).first()
    
    if existing_report:
        # Update existing report
        existing_report.calls_made = report.calls_made
        existing_report.shops_visited = report.shops_visited
        existing_report.enquiries_generated = report.enquiries_generated
        existing_report.sales_closed = report.sales_closed
        existing_report.report_notes = report.report_notes
        existing_report.report_submitted = True
        existing_report.submission_time = datetime.utcnow()
        
        db.commit()
        db.refresh(existing_report)
        
        response = DailyReportResponse(
            id=existing_report.id,
            salesman_id=existing_report.salesman_id,
            salesman_name=current_user.full_name or current_user.username,
            report_date=existing_report.report_date,
            calls_made=existing_report.calls_made,
            shops_visited=existing_report.shops_visited,
            enquiries_generated=existing_report.enquiries_generated,
            sales_closed=existing_report.sales_closed,
            report_notes=existing_report.report_notes or "",
            report_submitted=existing_report.report_submitted,
            submission_time=existing_report.submission_time
        )
        
        return response
    
    # Create new report
    new_report = DailyReport(
        salesman_id=current_user.id,
        report_date=report.report_date,
        calls_made=report.calls_made,
        shops_visited=report.shops_visited,
        enquiries_generated=report.enquiries_generated,
        sales_closed=report.sales_closed,
        report_notes=report.report_notes,
        report_submitted=True,
        submission_time=datetime.utcnow()
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # Log action
    log_create(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        module="DailyReport",
        record_id=str(new_report.id),
        record_type="DailyReport"
    )
    
    response = DailyReportResponse(
        id=new_report.id,
        salesman_id=new_report.salesman_id,
        salesman_name=current_user.full_name or current_user.username,
        report_date=new_report.report_date,
        calls_made=new_report.calls_made,
        shops_visited=new_report.shops_visited,
        enquiries_generated=new_report.enquiries_generated,
        sales_closed=new_report.sales_closed,
        report_notes=new_report.report_notes or "",
        report_submitted=new_report.report_submitted,
        submission_time=new_report.submission_time
    )
    
    return response


@router.get("/my-reports", response_model=List[DailyReportResponse])
def get_my_reports(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get my daily reports for last N days (Salesman only)"""
    
    if current_user.role != UserRole.SALESMAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only salesmen can view their reports"
        )
    
    start_date = date.today() - timedelta(days=days)
    
    reports = db.query(DailyReport).filter(
        DailyReport.salesman_id == current_user.id,
        DailyReport.report_date >= start_date
    ).order_by(DailyReport.report_date.desc()).all()
    
    return [
        DailyReportResponse(
            id=report.id,
            salesman_id=report.salesman_id,
            salesman_name=current_user.full_name or current_user.username,
            report_date=report.report_date,
            calls_made=report.calls_made,
            shops_visited=report.shops_visited,
            enquiries_generated=report.enquiries_generated,
            sales_closed=report.sales_closed,
            report_notes=report.report_notes or "",
            report_submitted=report.report_submitted,
            submission_time=report.submission_time
        )
        for report in reports
    ]


@router.get("/daily/all", response_model=List[DailyReportResponse])
def get_all_reports(
    days: int = 7,
    salesman_id: int = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get all daily reports (Reception/Admin only)"""
    
    # If not authenticated, return empty list
    if not current_user:
        return []
    
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and reception can view all reports"
        )
    
    start_date = date.today() - timedelta(days=days)
    
    query = db.query(DailyReport).filter(
        DailyReport.report_date >= start_date
    )
    
    if salesman_id:
        query = query.filter(DailyReport.salesman_id == salesman_id)
    
    reports = query.order_by(DailyReport.report_date.desc()).all()
    
    # Get salesman names
    response_list = []
    for report in reports:
        salesman = db.query(User).filter(User.id == report.salesman_id).first()
        response_list.append(
            DailyReportResponse(
                id=report.id,
                salesman_id=report.salesman_id,
                salesman_name=salesman.full_name or salesman.username if salesman else "Unknown",
                report_date=report.report_date,
                calls_made=report.calls_made,
                shops_visited=report.shops_visited,
                enquiries_generated=report.enquiries_generated,
                sales_closed=report.sales_closed,
                report_notes=report.report_notes or "",
                report_submitted=report.report_submitted,
                submission_time=report.submission_time
            )
        )
    
    # Log view action
    log_view(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        module="DailyReport",
        record_id="all",
        record_type="DailyReport"
    )
    
    return response_list


@router.get("/daily/missing")
def get_missing_reports(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get salesmen who haven't submitted today's report (Reception/Admin only)"""
    
    # If not authenticated, return empty result
    if not current_user:
        return {
            "date": date.today(),
            "total_salesmen": 0,
            "missing_count": 0,
            "missing_reports": []
        }
    
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and reception can check missing reports"
        )
    
    today = date.today()
    
    # Get all active salesmen
    salesmen = db.query(User).filter(
        User.role == UserRole.SALESMAN,
        User.is_active == True
    ).all()
    
    missing_reports = []
    
    for salesman in salesmen:
        # Check if report exists
        report = db.query(DailyReport).filter(
            DailyReport.salesman_id == salesman.id,
            DailyReport.report_date == today
        ).first()
        
        if not report or not report.report_submitted:
            missing_reports.append({
                "salesman_id": salesman.id,
                "salesman_name": salesman.full_name or salesman.username,
                "username": salesman.username,
                "status": "Not Submitted"
            })
    
    return {
        "date": today,
        "total_salesmen": len(salesmen),
        "missing_count": len(missing_reports),
        "missing_reports": missing_reports
    }


@router.get("/daily/stats")
def get_report_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get daily report statistics (Admin/Reception only)"""
    
    if current_user.role not in [UserRole.ADMIN, UserRole.RECEPTION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and reception can view statistics"
        )
    
    start_date = date.today() - timedelta(days=days)
    
    reports = db.query(DailyReport).filter(
        DailyReport.report_date >= start_date,
        DailyReport.report_submitted == True
    ).all()
    
    total_calls = sum(r.calls_made for r in reports)
    total_shops = sum(r.shops_visited for r in reports)
    total_enquiries = sum(r.enquiries_generated for r in reports)
    total_sales = sum(r.sales_closed for r in reports)
    
    return {
        "period_days": days,
        "total_reports_submitted": len(reports),
        "total_calls_made": total_calls,
        "total_shops_visited": total_shops,
        "total_enquiries_generated": total_enquiries,
        "total_sales_closed": total_sales,
        "avg_calls_per_day": round(total_calls / days, 2) if days > 0 else 0,
        "avg_shops_per_day": round(total_shops / days, 2) if days > 0 else 0
    }
