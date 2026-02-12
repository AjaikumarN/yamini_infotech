from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
import schemas
from auth import get_password_hash
import random
import string

def generate_id(prefix: str, db: Session, model, id_field: str) -> str:
    """Generate unique ID with prefix"""
    while True:
        random_num = ''.join(random.choices(string.digits, k=6))
        new_id = f"{prefix}{random_num}"
        existing = db.query(model).filter(getattr(model, id_field) == new_id).first()
        if not existing:
            return new_id

# User CRUD
def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        department=user.department
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

# Customer CRUD
def create_customer(db: Session, customer: schemas.CustomerCreate):
    customer_id = generate_id("CUST", db, models.Customer, "customer_id")
    db_customer = models.Customer(
        customer_id=customer_id,
        **customer.dict()
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

# Enquiry CRUD
def create_enquiry(db: Session, enquiry: schemas.EnquiryCreate, created_by: str):
    enquiry_id = generate_id("ENQ", db, models.Enquiry, "enquiry_id")
    
    # Convert Pydantic model to dict, excluding None values
    enquiry_data = enquiry.dict(exclude_none=True)
    
    # If product_id is provided, fetch product name
    if enquiry_data.get('product_id'):
        product = db.query(models.Product).filter(
            models.Product.id == enquiry_data['product_id']
        ).first()
        if product:
            enquiry_data['product_interest'] = product.name
    
    # Handle description field (map to notes) - remove it from data
    if 'description' in enquiry_data:
        if enquiry_data['description']:
            if enquiry_data.get('notes'):
                enquiry_data['notes'] += f"\n\nCustomer Message: {enquiry_data['description']}"
            else:
                enquiry_data['notes'] = enquiry_data['description']
        del enquiry_data['description']
    
    db_enquiry = models.Enquiry(
        enquiry_id=enquiry_id,
        **enquiry_data,
        created_by=created_by
    )
    db.add(db_enquiry)
    db.commit()
    db.refresh(db_enquiry)
    return db_enquiry

def get_enquiries(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Enquiry).offset(skip).limit(limit).all()

def update_enquiry(db: Session, enquiry_id: int, enquiry: schemas.EnquiryUpdate):
    db_enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    if db_enquiry:
        update_data = enquiry.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_enquiry, key, value)
        db.commit()
        db.refresh(db_enquiry)
    return db_enquiry

# Complaint CRUD
def create_complaint(db: Session, complaint: schemas.ComplaintCreate):
    ticket_no = generate_id("COMP", db, models.Complaint, "ticket_no")
    
    # Calculate SLA based on new priority values
    sla_hours = 24
    if complaint.priority == "CRITICAL":
        sla_hours = 2
    elif complaint.priority == "URGENT":
        sla_hours = 6
    elif complaint.priority == "NORMAL":
        sla_hours = 24
    
    sla_due = datetime.utcnow() + timedelta(hours=sla_hours)
    
    db_complaint = models.Complaint(
        ticket_no=ticket_no,
        sla_due=sla_due,
        **complaint.dict()
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def get_complaints(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Complaint).offset(skip).limit(limit).all()

def get_complaints_by_engineer(db: Session, engineer_id: int):
    return db.query(models.Complaint).filter(
        models.Complaint.assigned_to == engineer_id
    ).all()

def update_complaint_status(db: Session, complaint_id: int, status: str):
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if db_complaint:
        db_complaint.status = status
        if status == "Completed":
            db_complaint.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_complaint)
    return db_complaint

# Booking CRUD
def create_booking(db: Session, booking: schemas.BookingCreate):
    booking_id = generate_id("BK", db, models.Booking, "booking_id")
    db_booking = models.Booking(
        booking_id=booking_id,
        **booking.dict()
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def get_bookings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Booking).offset(skip).limit(limit).all()

# MIF CRUD (with access logging)
def create_mif_record(db: Session, mif: schemas.MIFRecordCreate):
    mif_id = generate_id("MIF-2025-", db, models.MIFRecord, "mif_id")
    db_mif = models.MIFRecord(
        mif_id=mif_id,
        **mif.dict()
    )
    db.add(db_mif)
    db.commit()
    db.refresh(db_mif)
    return db_mif

def get_mif_records(db: Session, user_id: int, ip_address: str, skip: int = 0, limit: int = 100):
    # Log access
    log_mif_access(db, None, user_id, "Viewed MIF Records", ip_address)
    
    return db.query(models.MIFRecord).offset(skip).limit(limit).all()

def log_mif_access(db: Session, mif_record_id: int, user_id: int, action: str, ip_address: str):
    """Log all MIF access"""
    log = models.MIFAccessLog(
        mif_record_id=mif_record_id,
        user_id=user_id,
        action=action,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()

def get_mif_access_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MIFAccessLog).order_by(
        models.MIFAccessLog.timestamp.desc()
    ).offset(skip).limit(limit).all()

# Sales CRUD
def create_sales_call(db: Session, call: schemas.SalesCallCreate, salesman_id: int):
    db_call = models.SalesCall(
        salesman_id=salesman_id,
        **call.dict()
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call

def create_shop_visit(db: Session, visit: schemas.ShopVisitCreate, salesman_id: int):
    db_visit = models.ShopVisit(
        salesman_id=salesman_id,
        **visit.dict()
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

def get_shop_visits_by_salesman(db: Session, salesman_id: int, limit: int = 30):
    return db.query(models.ShopVisit).filter(
        models.ShopVisit.salesman_id == salesman_id
    ).order_by(models.ShopVisit.visit_date.desc()).limit(limit).all()

def get_enquiries_by_salesman(db: Session, salesman_id: int):
    return db.query(models.Enquiry).filter(
        models.Enquiry.assigned_to == salesman_id
    ).order_by(models.Enquiry.created_at.desc()).all()

# Follow-up CRUD
def create_followup(db: Session, followup: schemas.FollowUpCreate, salesman_id: int, created_by: int = None):
    db_followup = models.SalesFollowUp(
        salesman_id=salesman_id,
        created_by=created_by,
        **followup.dict()
    )
    db.add(db_followup)
    
    # Update enquiry's last_follow_up timestamp
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == followup.enquiry_id).first()
    if enquiry:
        enquiry.last_follow_up = followup.followup_date
        enquiry.last_followup_at = followup.followup_date
    
    db.commit()
    db.refresh(db_followup)
    return db_followup

def get_followups_by_salesman(db: Session, salesman_id: int, status: str = None):
    query = db.query(models.SalesFollowUp).filter(models.SalesFollowUp.salesman_id == salesman_id)
    if status:
        query = query.filter(models.SalesFollowUp.status == status)
    return query.order_by(models.SalesFollowUp.followup_date).all()

def update_followup(db: Session, followup_id: int, followup: schemas.FollowUpUpdate):
    db_followup = db.query(models.SalesFollowUp).filter(models.SalesFollowUp.id == followup_id).first()
    if not db_followup:
        return None
    
    for key, value in followup.dict(exclude_unset=True).items():
        setattr(db_followup, key, value)
    
    db.commit()
    db.refresh(db_followup)
    return db_followup

def get_sales_calls_by_salesman(db: Session, salesman_id: int, date: datetime = None):
    query = db.query(models.SalesCall).filter(models.SalesCall.salesman_id == salesman_id)
    if date:
        query = query.filter(models.SalesCall.call_date >= date)
    return query.all()

# Attendance CRUD
def create_attendance(db: Session, attendance: schemas.AttendanceCreate, employee_id: int):
    db_attendance = models.Attendance(
        employee_id=employee_id,
        **attendance.dict()
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_attendance_by_employee(db: Session, employee_id: int, date: datetime = None):
    query = db.query(models.Attendance).filter(models.Attendance.employee_id == employee_id)
    if date:
        start_of_day = date.replace(hour=0, minute=0, second=0)
        end_of_day = date.replace(hour=23, minute=59, second=59)
        query = query.filter(
            models.Attendance.date >= start_of_day,
            models.Attendance.date <= end_of_day
        )
    return query.all()

# Product & Service CRUD
def create_product(db: Session, product: schemas.ProductCreate):
    product_id = generate_id("PROD", db, models.Product, "product_id")
    db_product = models.Product(
        product_id=product_id,
        **product.dict()
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def get_product_by_id(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def create_service(db: Session, service: schemas.ServiceCreate):
    service_id = generate_id("SRV", db, models.Service, "service_id")
    db_service = models.Service(
        service_id=service_id,
        **service.dict()
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def get_services(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Service).offset(skip).limit(limit).all()

# Notification CRUD
def create_notification(db: Session, notification: schemas.NotificationCreate):
    db_notification = models.Notification(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_notifications_by_user(db: Session, user_id: int, unread_only: bool = False):
    query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    if unread_only:
        query = query.filter(models.Notification.read_status == False)
    return query.order_by(models.Notification.created_at.desc()).all()

def mark_notification_read(db: Session, notification_id: int):
    db_notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id
    ).first()
    if db_notification:
        db_notification.read_status = True
        db.commit()
    return db_notification
