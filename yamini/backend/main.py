from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
import os
from database import engine, get_db
from scheduler import start_scheduler, stop_scheduler
from contextlib import asynccontextmanager
from pathlib import Path
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import pytz
from sqlalchemy.orm import Session

# Import routers
from routers import auth_routes
from routers import users
from routers import customers
from routers import enquiries
from routers import complaints
from routers import service_requests
from routers import service_engineer
from routers import feedback
from routers import attendance
from routers import mif
from routers import sales
from routers import products
from routers import product_management
from routers import notifications
from routers import bookings
from routers import reports
from routers import audit
from routers import orders
from routers import admin_sales
from routers import visitors
from routers import stock_movements
from routers import analytics
from routers import invoices
from routers import settings
from routers import chatbot
from routers import verified_attendance
from routers import outstanding
from routers import calls
from routers import leads  # Professional CRM module
# Old tracking routers — REPLACED by unified tracking system
# from routers import tracking
# from routers import salesman_tracking
from routers import unified_tracking   # New unified session-based tracking
from routers import geofencing          # Extracted geofencing/device monitoring
from routers import whatsapp_logs       # WhatsApp notification audit logs
from services.daily_report import generate_daily_report

# Global scheduler for daily reports
daily_scheduler = AsyncIOScheduler(timezone=pytz.timezone('Asia/Kolkata'))


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Yamini Infotech ERP System...")
    models.Base.metadata.create_all(bind=engine)
    try:
        start_scheduler()
        print("Scheduler started - Automated reminders active!")
    except Exception as e:
        print(f"⚠️  Scheduler initialization skipped: {str(e)}")
    
    # Clean stale tracking sessions left from prior days (e.g. server crash)
    try:
        from scheduler import cleanup_stale_tracking_sessions
        cleanup_stale_tracking_sessions()
    except Exception as e:
        print(f"⚠️  Stale tracking session cleanup skipped: {str(e)}")
    
    # Start daily report scheduler
    try:
        from database import SessionLocal
        async def daily_report_job():
            db = SessionLocal()
            try:
                await generate_daily_report(db)
            finally:
                db.close()
        
        daily_scheduler.add_job(
            daily_report_job,
            'cron',
            hour=18, minute=30,
            id='daily_reports'
        )
        daily_scheduler.start()
        print("🚀 Daily reports scheduler started - 6:30 PM IST")
    except Exception as e:
        print(f"⚠️  Daily scheduler initialization skipped: {str(e)}")
    yield
    # Shutdown
    print("Shutting down...")
    try:
        stop_scheduler()
        print("Scheduler stopped")
    except Exception as e:
        print(f"⚠️  Scheduler stop skipped: {str(e)}")
    
    try:
        daily_scheduler.shutdown()
        print("Daily scheduler stopped")
    except Exception as e:
        print(f"⚠️  Daily scheduler stop skipped: {str(e)}")


app = FastAPI(
    title="Yamini Infotech Business Management System",
    description="Complete business management system with CRM, Sales, Service, and Admin modules",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware — configure via ALLOWED_ORIGINS env var for production
# Example: ALLOWED_ORIGINS=https://yamini.com,https://admin.yamini.com
_dev_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
_env_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
_cors_origins = _env_origins if _env_origins else _dev_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(users.router)
app.include_router(customers.router)
app.include_router(enquiries.router)
app.include_router(complaints.router)
app.include_router(service_requests.router)
app.include_router(service_engineer.router)
app.include_router(feedback.router)
app.include_router(attendance.router)
app.include_router(mif.router)
app.include_router(sales.router)
app.include_router(orders.router)
app.include_router(admin_sales.router)
app.include_router(products.router)
app.include_router(product_management.router)
app.include_router(notifications.router)
app.include_router(bookings.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(visitors.router)
app.include_router(stock_movements.router)
app.include_router(analytics.router)
app.include_router(invoices.router)
app.include_router(settings.router)
app.include_router(chatbot.router)
app.include_router(verified_attendance.router)
app.include_router(outstanding.router)
app.include_router(calls.router)  # Old call system (deprecated)
app.include_router(leads.router)  # New professional CRM
# Unified tracking system (replaces old tracking + salesman_tracking)
app.include_router(unified_tracking.router)          # New session-based endpoints
app.include_router(unified_tracking.compat_router)    # Backward-compatible old paths
app.include_router(geofencing.router)                 # Geofencing & device monitoring
app.include_router(whatsapp_logs.router)              # WhatsApp notification audit logs

# Mount static files for uploads
upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {
        "message": "Yamini Infotech API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Test endpoints for live tracking system
@app.post("/api/admin/reports/test-daily")
async def test_daily_report(db: Session = Depends(get_db)):
    """Test endpoint to manually trigger daily report generation"""
    result = await generate_daily_report(db)
    return result


@app.post("/api/test/brevo-direct")
async def test_brevo_smtp():
    """Test Brevo SMTP connection directly"""
    try:
        from services.brevo_email import BrevoEmailService
        service = BrevoEmailService()
        service.send_report(
            "🔥 SMTP TEST - Yamini Infotech",
            "<h1>✅ Brevo SMTP Working!</h1><p>This is a test email from the tracking system.</p>"
        )
        return {"status": "success", "message": "Test email sent to admin"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# To run: uvicorn main:app --reload --port 8000
