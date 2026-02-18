from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, Date, Text, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, date
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    RECEPTION = "RECEPTION"  # Merged: Office + Reception duties
    SALESMAN = "SALESMAN"
    SERVICE_ENGINEER = "SERVICE_ENGINEER"
    CUSTOMER = "CUSTOMER"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), nullable=False)
    department = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Personal Information
    gender = Column(String)
    date_of_birth = Column(Date)
    phone = Column(String)
    mobile = Column(String)
    current_address = Column(Text)
    permanent_address = Column(Text)
    
    # Identification / KYC
    employee_id = Column(String, unique=True, index=True)
    nationality = Column(String, default="Indian")
    photograph = Column(String)  # Store file path or URL
    
    # Employment Details
    date_of_joining = Column(Date)
    
    # Salary & Payroll
    salary = Column(Float)
    monthly_pay = Column(Float)  # Alias for salary
    bank_name = Column(String)
    bank = Column(String)  # Alias for bank_name
    account_number = Column(String)
    bank_account = Column(String)  # Alias for account_number
    
    # Relationships
    enquiries = relationship("Enquiry", back_populates="assigned_user", foreign_keys="Enquiry.assigned_to")
    complaints = relationship("Complaint", back_populates="assigned_engineer")
    sales_calls = relationship("SalesCall", back_populates="salesman")
    attendance_records = relationship("Attendance", back_populates="employee")
    mif_access_logs = relationship("MIFAccessLog", back_populates="user")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    company = Column(String)
    join_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Active")
    total_purchases = Column(Integer, default=0)
    total_value = Column(Float, default=0)
    amc_status = Column(String)
    amc_expiry = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    enquiries = relationship("Enquiry", back_populates="customer")
    complaints = relationship("Complaint", back_populates="customer")
    bookings = relationship("Booking", back_populates="customer")
    mif_records = relationship("MIFRecord", back_populates="customer")

class Enquiry(Base):
    __tablename__ = "enquiries"
    
    id = Column(Integer, primary_key=True, index=True)
    enquiry_id = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))  # NEW: Link to product
    customer_name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    product_interest = Column(String)  # Keep for backward compatibility
    priority = Column(String, default="WARM")  # HOT, WARM, COLD
    status = Column(String, default="NEW")
    source = Column(String, default="website")  # website, call, walk-in, field_visit, phone
    assigned_to = Column(Integer, ForeignKey("users.id"))
    next_follow_up = Column(DateTime)
    last_follow_up = Column(DateTime)
    reminder_frequency = Column(String, default="monthly")  # weekly, monthly, future
    instruction_notes = Column(Text)
    reminder_sent_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String)
    
    # Soft-delete and visibility tracking
    is_deleted = Column(Boolean, default=False, index=True)
    is_viewed = Column(Boolean, default=False, index=True)
    created_by_role = Column(String)  # Role of creator (ADMIN, RECEPTION, SALESMAN, etc.)
    assigned_role = Column(String)  # Target role for this enquiry (SALESMAN, SERVICE_ENGINEER)
    
    # Enhanced fields for conversion tracking
    last_followup_at = Column(DateTime)  # Last follow-up timestamp
    converted_to_order = Column(Boolean, default=False)  # Conversion flag
    order_id = Column(Integer, ForeignKey("orders.id"))  # Link to order
    
    # WhatsApp notification tracking (idempotency)
    whatsapp_enquiry_sent = Column(Boolean, default=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="enquiries")
    product = relationship("Product")
    assigned_user = relationship("User", back_populates="enquiries", foreign_keys=[assigned_to])
    # Explicitly define the order relationships to avoid ambiguity
    orders = relationship("Order", foreign_keys="Order.enquiry_id", back_populates="enquiry")
    converted_order = relationship("Order", foreign_keys=[order_id], back_populates="source_enquiry")

# FollowUpHistory removed - using SalesFollowUp as single source of truth

class SalesFollowUp(Base):
    __tablename__ = "sales_followups"
    
    id = Column(Integer, primary_key=True, index=True)
    enquiry_id = Column(Integer, ForeignKey("enquiries.id"))
    salesman_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for Reception-created follow-ups
    note = Column(Text, nullable=False)
    note_type = Column(String, default="follow_up")  # call, meeting, follow_up, visit, general
    followup_date = Column(DateTime, nullable=False)
    status = Column(String, default="Pending")  # Pending, Completed
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))  # Track who created
    
    # Enhanced fields for voice-to-text
    voice_note_text = Column(Text)  # Transcribed follow-up notes
    outcome = Column(String)  # Follow-up result (Interested, Not Interested, Callback, etc.)

# EnquiryNote removed - merged into SalesFollowUp with note_type field

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_no = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    customer_name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    company = Column(String)
    address = Column(Text)
    machine_model = Column(String)
    fault_description = Column(Text)
    priority = Column(String, default="NORMAL")  # NORMAL, URGENT, CRITICAL
    status = Column(String, default="ASSIGNED")  # ASSIGNED, ON_THE_WAY, IN_PROGRESS, ON_HOLD, COMPLETED
    assigned_to = Column(Integer, ForeignKey("users.id"))
    
    # Soft-delete and visibility tracking
    is_deleted = Column(Boolean, default=False, index=True)
    is_viewed = Column(Boolean, default=False, index=True)
    created_by_role = Column(String)  # Role of creator
    
    # SLA Fields
    sla_time = Column(DateTime)  # When SLA expires
    sla_warning_sent = Column(Boolean, default=False)
    sla_breach_sent = Column(Boolean, default=False)  # Updated field name for consistency
    
    # Service completion fields
    completed_at = Column(DateTime)
    resolution_notes = Column(Text)  # Engineer's resolution notes
    parts_replaced = Column(Text)  # Parts replaced during service
    
    # Feedback fields
    feedback_url = Column(String)  # Generated feedback URL
    feedback_qr = Column(Text)  # Base64 encoded QR code
    
    # Check-in location (GPS proof of arrival)
    checkin_latitude = Column(Float)
    checkin_longitude = Column(Float)
    checkin_time = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # WhatsApp notification tracking (idempotency)
    whatsapp_service_created_sent = Column(Boolean, default=False)
    whatsapp_engineer_assigned_sent = Column(Boolean, default=False)
    whatsapp_service_completed_sent = Column(Boolean, default=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="complaints")
    assigned_engineer = relationship("User", back_populates="complaints")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    service_request_id = Column(Integer, ForeignKey("complaints.id"))
    customer_name = Column(String)
    rating = Column(Integer)  # 1-5 stars
    comment = Column(Text)
    is_negative = Column(Boolean, default=False)  # True if rating <= 2
    escalated = Column(Boolean, default=False)  # Auto-escalate negative feedback
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    service_request = relationship("Complaint")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    service_type = Column(String)
    machine_model = Column(String)
    description = Column(Text)
    preferred_date = Column(DateTime)
    urgency = Column(String, default="normal")
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="bookings")

class SalesCall(Base):
    __tablename__ = "sales_calls"
    
    id = Column(Integer, primary_key=True, index=True)
    salesman_id = Column(Integer, ForeignKey("users.id"))
    customer_name = Column(String)
    phone = Column(String)
    call_type = Column(String)  # Cold, Follow-up, Hot
    outcome = Column(String)
    notes = Column(Text)
    call_date = Column(DateTime, default=datetime.utcnow)
    
    # Enhanced fields for voice-to-text and tracking
    call_outcome = Column(String)  # Success, No Answer, Callback, etc.
    next_action_date = Column(DateTime)  # When to follow up
    voice_note_text = Column(Text)  # Transcribed voice note
    enquiry_id = Column(Integer, ForeignKey("enquiries.id"))  # Link to enquiry
    
    salesman = relationship("User", back_populates="sales_calls")

class ShopVisit(Base):
    __tablename__ = "shop_visits"
    
    id = Column(Integer, primary_key=True, index=True)
    salesman_id = Column(Integer, ForeignKey("users.id"))
    customer_name = Column(String)
    shop_name = Column(String)
    shop_address = Column(Text)
    customer_contact = Column(String)
    location = Column(String)
    requirements = Column(Text)
    requirement_details = Column(Text)
    product_interest = Column(String)
    expected_closing = Column(DateTime)
    follow_up_date = Column(DateTime)
    follow_up_required = Column(Boolean, default=True)
    visit_type = Column(String, default="New")
    notes = Column(Text)
    visit_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Enhanced fields for GPS and voice
    gps_lat = Column(Float)  # Visit GPS latitude
    gps_lng = Column(Float)  # Visit GPS longitude
    photo_url = Column(String)  # Visit photo
    voice_note_text = Column(Text)  # Transcribed voice note
    enquiry_id = Column(Integer, ForeignKey("enquiries.id"))  # Link to enquiry

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)  # UTC timestamp for logs
    attendance_date = Column(Date, nullable=False, index=True)  # Business date (IST) - SINGLE SOURCE OF TRUTH
    time = Column(String)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    photo_path = Column(String)
    status = Column(String, default="Present")  # Present, Late, Absent
    
    # Enhanced fields for smart ERP
    check_in_time = Column(String)  # HH:MM:SS format
    check_in_lat = Column(Float)  # GPS latitude
    check_in_lng = Column(Float)  # GPS longitude
    photo_url = Column(String)  # Photo URL/path
    
    employee = relationship("User", back_populates="attendance_records")

class MIFRecord(Base):
    __tablename__ = "mif_records"
    
    id = Column(Integer, primary_key=True, index=True)
    mif_id = Column(String, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    customer_name = Column(String, nullable=False)
    machine_model = Column(String)
    serial_number = Column(String, unique=True)
    installation_date = Column(DateTime)
    location = Column(Text)
    machine_value = Column(Float)
    amc_status = Column(String)
    amc_expiry = Column(DateTime)
    amc_reminder_sent_date = Column(DateTime)
    last_service = Column(DateTime)
    next_service = Column(DateTime)
    services_done = Column(Integer, default=0)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="mif_records")
    access_logs = relationship("MIFAccessLog", back_populates="mif_record")

class MIFAccessLog(Base):
    __tablename__ = "mif_access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    mif_record_id = Column(Integer, ForeignKey("mif_records.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)
    
    user = relationship("User", back_populates="mif_access_logs")
    mif_record = relationship("MIFRecord", back_populates="access_logs")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    model = Column(String)
    brand = Column(String)
    price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    description = Column(Text)
    features = Column(Text)
    usage_type = Column(String)  # office, school, shop, home
    image_url = Column(String)
    specifications = Column(Text)  # JSON string
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Stock control – enterprise fields
    minimum_stock_level = Column(Integer, default=0)       # Low-stock alert threshold
    weighted_avg_cost = Column(Float, default=0.0)         # Running weighted average cost

class Service(Base):
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    service_type = Column(String)
    price = Column(Float)
    duration = Column(String)
    description = Column(Text)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    reminder_type = Column(String)  # AMC Expiry, Service Due, Follow-up
    customer_id = Column(Integer, ForeignKey("customers.id"))
    due_date = Column(DateTime)
    priority = Column(String)
    status = Column(String, default="Pending")
    notify_to = Column(Text)  # JSON array of user IDs/roles
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    notification_type = Column(String)
    title = Column(String)
    message = Column(Text)
    priority = Column(String)
    module = Column(String)
    action_url = Column(String)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)

# NEW MODELS FOR ENHANCED ERP FEATURES

# DailyReport removed - using SalesDailyReport as single source of truth

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String)
    action = Column(String)  # CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT
    module = Column(String)  # Enquiry, MIF, Complaint, Customer, etc.
    record_id = Column(String)
    record_type = Column(String)
    changes = Column(Text)  # JSON of what changed
    ip_address = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class ServiceEngineerHierarchy(Base):
    __tablename__ = "service_engineer_hierarchy"
    
    id = Column(Integer, primary_key=True, index=True)
    engineer_id = Column(Integer, ForeignKey("users.id"), unique=True)
    is_incharge = Column(Boolean, default=False)
    reports_to = Column(Integer, ForeignKey("users.id"))
    expertise_area = Column(String)  # e.g., "Printer", "Copier", "Scanner"
    active_cases = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    engineer = relationship("User", foreign_keys=[engineer_id])
    supervisor = relationship("User", foreign_keys=[reports_to])

class ReminderSchedule(Base):
    __tablename__ = "reminder_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    schedule_type = Column(String)  # HOT_ENQUIRY, WARM_ENQUIRY, AMC_EXPIRY, SERVICE_DUE
    related_id = Column(Integer)  # ID of enquiry, customer, complaint, etc.
    related_type = Column(String)  # enquiry, customer, complaint
    next_reminder_date = Column(DateTime)
    frequency = Column(String)  # weekly, monthly, once
    last_sent = Column(DateTime)
    active = Column(Boolean, default=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ORDER MANAGEMENT MODELS

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    enquiry_id = Column(Integer, ForeignKey("enquiries.id"))
    salesman_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    customer_name = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount_percent = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    expected_delivery_date = Column(DateTime)
    notes = Column(Text)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED, COMPLETED
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)
    invoice_number = Column(String)
    invoice_generated = Column(Boolean, default=False)
    stock_deducted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Soft-delete and visibility tracking
    is_deleted = Column(Boolean, default=False, index=True)
    is_viewed = Column(Boolean, default=False, index=True)
    
    # Relationships
    enquiry = relationship("Enquiry", foreign_keys=[enquiry_id], back_populates="orders")
    source_enquiry = relationship("Enquiry", foreign_keys="Enquiry.order_id", back_populates="converted_order", uselist=False)
    salesman = relationship("User", foreign_keys=[salesman_id])
    customer = relationship("Customer")
    product = relationship("Product")
    approver = relationship("User", foreign_keys=[approved_by])

class DailyReport(Base):
    """Salesman Daily Report - Single source of truth for daily activities"""
    __tablename__ = "daily_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    salesman_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_date = Column(Date, nullable=False, default=date.today)
    
    # Activity metrics (AUTO-DERIVED from backend - read-only)
    calls_made = Column(Integer, default=0)
    shops_visited = Column(Integer, default=0)
    enquiries_generated = Column(Integer, default=0)
    sales_closed = Column(Integer, default=0)
    
    # Manual input sections (SALESMAN FILLS)
    achievements = Column(Text)  # Today's achievements
    challenges = Column(Text)    # Challenges faced
    tomorrow_plan = Column(Text) # Plan for tomorrow
    report_notes = Column(Text)  # Additional notes (legacy)
    
    # Report metadata
    report_submitted = Column(Boolean, default=False)
    submission_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Attendance linkage (MANDATORY)
    attendance_id = Column(Integer, ForeignKey("attendance.id"), nullable=True)
    
    # Enhanced fields for smart tracking
    voice_note_text = Column(Text)  # Transcribed daily summary
    total_distance_km = Column(Float, default=0)  # Distance traveled
    work_start_time = Column(DateTime)  # Day start time
    work_end_time = Column(DateTime)  # Day end time
    
    # Soft-delete tracking
    is_deleted = Column(Boolean, default=False, index=True)
    
    # Relationships
    salesman = relationship("User", foreign_keys=[salesman_id])
    attendance = relationship("Attendance", foreign_keys=[attendance_id])

class Visitor(Base):
    """Visitor Log - Reception desk visitor tracking"""
    __tablename__ = "visitors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    whom_to_meet = Column(String, nullable=False)
    in_time = Column(String, nullable=False)
    out_time = Column(String)
    date = Column(Date, default=date.today)
    logged_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Soft-delete tracking
    is_deleted = Column(Boolean, default=False, index=True)
    
    logged_by_user = relationship("User", foreign_keys=[logged_by])

class StockMovement(Base):
    """
    Stock Movement - Delivery IN/OUT tracking
    
    THREE SEPARATE CONCEPTS:
    1. Stock Movement = What stock moved (logistics truth)
    2. Approval Status = Is this movement accepted? (operational control)
    3. Payment Status = Has money been settled? (financial truth)
    """
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    movement_type = Column(String, nullable=False)  # IN, OUT
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, default=0.0)            # Per-unit cost for valuation
    reference_type = Column(String)  # SERVICE, ORDER, MANUAL
    reference_id = Column(String)  # Service ID / Order ID
    date = Column(Date, default=date.today)
    logged_by = Column(Integer, ForeignKey("users.id"))
    
    # Approval Status (Operational Control) - Can only be changed by Admin
    # PENDING -> APPROVED or REJECTED
    approval_status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    
    # Payment Status (Financial Truth) - Can be updated after creation by Admin/Finance
    # UNBILLED -> PENDING -> PAID
    payment_status = Column(String, default="UNBILLED")  # UNBILLED, PENDING, PAID
    invoice_reference = Column(String)  # Invoice number when billed
    payment_updated_by = Column(Integer, ForeignKey("users.id"))
    payment_updated_at = Column(DateTime)
    
    # Engineer linkage for OUT movements
    service_request_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    engineer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Soft-delete tracking
    is_deleted = Column(Boolean, default=False, index=True)
    
    # Delivery tracking
    delivery_status = Column(String)  # PENDING, DELIVERED, FAILED, REATTEMPT
    
    # WhatsApp notification tracking (idempotency)
    whatsapp_delivery_failed_sent = Column(Boolean, default=False)
    whatsapp_delivery_reattempt_sent = Column(Boolean, default=False)
    
    # Relationships
    logged_by_user = relationship("User", foreign_keys=[logged_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    payment_updated_by_user = relationship("User", foreign_keys=[payment_updated_by])
    service_request = relationship("Complaint", foreign_keys=[service_request_id])
    engineer = relationship("User", foreign_keys=[engineer_id])

class ServiceEngineerDailyReport(Base):
    """Service Engineer Daily Report - End-of-day activity log"""
    __tablename__ = "service_engineer_daily_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    engineer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_date = Column(Date, nullable=False, default=date.today)
    
    # Activity metrics
    jobs_completed = Column(Integer, default=0)
    jobs_pending = Column(Integer, default=0)
    issues_faced = Column(Text)  # Problems encountered during the day
    remarks = Column(Text)  # Additional observations
    
    # Report metadata
    submitted_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    engineer = relationship("User", foreign_keys=[engineer_id])


# ===========================
# CHATBOT MODELS
# ===========================

class ChatbotKnowledge(Base):
    """Knowledge base documents for RAG (FAISS vectorization)"""
    __tablename__ = "chatbot_knowledge"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)  # Actual knowledge content
    content_en = Column(Text)  # English version
    content_ta = Column(Text)  # Tamil version
    category = Column(String, index=True)  # faq, product, service, amc, policy, warranty, complaint
    subcategory = Column(String)  # More specific categorization
    keywords = Column(Text)  # Comma-separated keywords for search
    
    # Vector embedding (stored as JSON array)
    embedding_en = Column(Text)  # FAISS vector for English (JSON)
    embedding_ta = Column(Text)  # FAISS vector for Tamil (JSON)
    
    # Control flags
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Higher = more important
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CallOutcome(str, enum.Enum):
    NOT_INTERESTED = "NOT_INTERESTED"
    INTERESTED_BUY_LATER = "INTERESTED_BUY_LATER"
    PURCHASED = "PURCHASED"

class ProductCondition(str, enum.Enum):
    WORKING_FINE = "WORKING_FINE"
    SERVICE_NEEDED = "SERVICE_NEEDED"

class Lead(Base):
    """
    Professional CRM Lead table - ONE row per customer (latest state only).
    This is what appears in 'All Calls' page - no duplicates.
    """
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reception user who owns this lead
    reception_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Customer details (unique by phone)
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False, index=True, unique=True)  # Unique constraint
    email = Column(String)
    address = Column(Text)
    
    # Current product interest
    product_name = Column(String, nullable=False)
    
    # Current status (latest state)
    current_status = Column(String, default="NEW")  # NEW, FOLLOW_UP, CONVERTED, CLOSED
    current_outcome = Column(Enum(CallOutcome), nullable=False)  # Latest outcome
    
    # Follow-up tracking
    requires_followup = Column(Boolean, default=False)
    next_followup_date = Column(Date, nullable=True)
    last_call_date = Column(Date, nullable=True)
    
    # Product condition (for PURCHASED customers)
    product_condition = Column(Enum(ProductCondition), nullable=True)
    
    # Service tracking
    service_complaint_created = Column(Boolean, default=False)
    service_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    
    # Metrics
    call_count = Column(Integer, default=1)  # Total calls made to this customer
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)  # First call date
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reception_user = relationship("User", foreign_keys=[reception_user_id])
    call_logs = relationship("CallLog", back_populates="lead")


class CallLog(Base):
    """
    Call history log - stores EVERY call interaction.
    This is history only, NOT shown in 'All Calls' list.
    """
    __tablename__ = "call_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to lead
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    reception_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Call details
    call_type = Column(String, nullable=False)  # "New Lead", "Monthly Follow-up", etc.
    call_outcome = Column(Enum(CallOutcome), nullable=False)
    notes = Column(Text)
    
    # For follow-up calls
    product_condition = Column(Enum(ProductCondition), nullable=True)  # PURCHASED follow-ups
    
    # Service tracking
    service_complaint_created = Column(Boolean, default=False)
    service_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    
    # Timestamps
    call_date = Column(Date, default=date.today, index=True)
    call_time = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lead = relationship("Lead", back_populates="call_logs")
    reception_user = relationship("User", foreign_keys=[reception_user_id])


class ReceptionCall(Base):
    """
    DEPRECATED - Use Lead + CallLog instead.
    Keeping for backward compatibility during migration.
    """
    __tablename__ = "reception_calls"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reception user who made the call
    reception_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Customer details
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False, index=True)
    email = Column(String)
    address = Column(Text)
    
    # Call details
    product_name = Column(String, nullable=False)
    call_type = Column(String, nullable=False)  # "New Lead", "Monthly Follow-up", "Service Check"
    notes = Column(Text)
    call_outcome = Column(Enum(CallOutcome), nullable=False)  # NOT_INTERESTED, INTERESTED_BUY_LATER, PURCHASED
    
    # Monthly follow-up tracking
    requires_monthly_followup = Column(Boolean, default=False)  # True for PURCHASED or INTERESTED_BUY_LATER
    next_followup_date = Column(Date, nullable=True)  # Auto-set to next month
    last_followup_date = Column(Date, nullable=True)
    followup_count = Column(Integer, default=0)
    
    # For PURCHASED customers - product status tracking
    product_condition = Column(Enum(ProductCondition), nullable=True)
    service_complaint_created = Column(Boolean, default=False)
    service_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    
    # Parent call reference (for follow-up calls)
    parent_call_id = Column(Integer, ForeignKey("reception_calls.id"), nullable=True)
    is_followup_call = Column(Boolean, default=False)
    
    call_date = Column(Date, default=date.today, index=True)
    call_time = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reception_user = relationship("User", foreign_keys=[reception_user_id])


class ChatSession(Base):
    """Customer chat sessions"""
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)  # UUID
    
    # Customer identification (optional - can chat anonymously)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    customer_phone = Column(String)
    customer_email = Column(String)
    customer_name = Column(String)
    
    # Session metadata
    language = Column(String, default="en")  # en, ta
    device_info = Column(String)  # Browser/device fingerprint
    ip_address = Column(String)
    
    # Session status
    status = Column(String, default="active")  # active, handed_off, closed, escalated
    handoff_to = Column(Integer, ForeignKey("users.id"))  # Receptionist who took over
    handoff_at = Column(DateTime)
    
    # Analytics
    message_count = Column(Integer, default=0)
    avg_confidence = Column(Float)  # Average bot confidence
    enquiry_created = Column(Boolean, default=False)
    enquiry_id = Column(Integer, ForeignKey("enquiries.id"))
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    last_message_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime)
    
    # Relationships
    customer = relationship("Customer")
    messages = relationship("ChatMessage", back_populates="session")
    handoff_user = relationship("User", foreign_keys=[handoff_to])
    enquiry = relationship("Enquiry")


class ChatMessage(Base):
    """Individual chat messages"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    
    # Message content
    message = Column(Text, nullable=False)
    sender = Column(String, nullable=False)  # customer, bot, receptionist
    language = Column(String, default="en")
    
    # Bot intelligence data
    intent_detected = Column(String)  # enquiry, complaint, service, amc, pricing, general
    confidence_score = Column(Float)  # 0.0 to 1.0
    knowledge_docs_used = Column(Text)  # JSON array of document IDs used
    
    # Handoff/escalation
    triggered_handoff = Column(Boolean, default=False)
    handoff_reason = Column(String)  # low_confidence, explicit_request, repeated_query
    
    # Timestamps
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")


class ChatbotHandoff(Base):
    """Receptionist handoff queue"""
    __tablename__ = "chatbot_handoffs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    
    # Handoff details
    reason = Column(String, nullable=False)  # low_confidence, customer_request, complex_query
    priority = Column(String, default="normal")  # urgent, normal, low
    status = Column(String, default="pending")  # pending, assigned, resolved
    
    # Assignment
    assigned_to = Column(Integer, ForeignKey("users.id"))
    assigned_at = Column(DateTime)
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Context for receptionist
    customer_name = Column(String)
    customer_phone = Column(String)
    summary = Column(Text)  # AI-generated summary of conversation
    last_messages = Column(Text)  # JSON: Last 5 messages
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("ChatSession")
    assigned_user = relationship("User")


class ChatbotAnalytics(Base):
    """Daily chatbot performance metrics"""
    __tablename__ = "chatbot_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True, index=True)
    
    # Volume metrics
    total_sessions = Column(Integer, default=0)
    total_messages = Column(Integer, default=0)
    unique_customers = Column(Integer, default=0)
    
    # Language split
    sessions_en = Column(Integer, default=0)
    sessions_ta = Column(Integer, default=0)
    
    # Performance
    avg_confidence = Column(Float)
    avg_session_duration = Column(Float)  # seconds
    avg_messages_per_session = Column(Float)
    
    # Outcomes
    enquiries_created = Column(Integer, default=0)
    handoffs_triggered = Column(Integer, default=0)
    sessions_resolved = Column(Integer, default=0)
    
    # Top intents
    top_intent_1 = Column(String)
    top_intent_1_count = Column(Integer, default=0)
    top_intent_2 = Column(String)
    top_intent_2_count = Column(Integer, default=0)
    top_intent_3 = Column(String)
    top_intent_3_count = Column(Integer, default=0)
    
    # Knowledge gaps (unanswered questions)
    unanswered_queries = Column(Text)  # JSON array
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Outstanding(Base):
    """Outstanding invoices and payments tracking"""
    __tablename__ = "outstanding"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True, nullable=False)
    invoice_no = Column(String, unique=True, index=True, nullable=False)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0)
    balance = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    invoice_date = Column(Date, default=date.today)
    status = Column(String, default="PENDING")  # PENDING, OVERDUE, PAID, PARTIAL
    
    # Additional info
    customer_phone = Column(String)
    customer_email = Column(String)
    notes = Column(Text)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    # Soft-delete tracking
    is_deleted = Column(Boolean, default=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============= ENTERPRISE TRACKING SYSTEM =============

class SalesmanVisitLog(Base):
    """
    Ordered visit points for salesmen - THE source of truth for routes.
    Each record represents a meaningful stop (customer visit, area check).
    Routes are ALWAYS calculated from this table, never from live GPS alone.
    """
    __tablename__ = "salesman_visit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    salesman_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    visit_date = Column(Date, nullable=False, index=True, default=date.today)
    sequence_no = Column(Integer, nullable=False)  # Auto-increment per salesman per day
    
    # Location data
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_m = Column(Float, default=0)
    address = Column(String(500))  # Resolved address from reverse geocoding
    
    # Visit metadata
    visit_type = Column(String(50), default="manual")  # attendance, manual, job_completion, customer_visit
    customer_name = Column(String(200))  # Optional customer association
    notes = Column(Text)
    
    # Calculated fields (set by backend)
    distance_from_prev_km = Column(Float, default=0)  # Distance from previous visit
    
    # Timestamps
    visited_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    salesman = relationship("User", foreign_keys=[salesman_id])


class SalesmanLiveLocation(Base):
    """
    DEPRECATED — Replaced by UnifiedLiveLocation.
    Table kept for data preservation during migration.
    """
    __tablename__ = "salesman_live_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    salesman_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Current position
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_m = Column(Float, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    salesman = relationship("User", foreign_keys=[salesman_id])


# ============= UNIFIED TRACKING SYSTEM (Production-Grade) =============
# Single source of truth for: Sessions, GPS, Visits, Routes
# Replaces: salesman_visits, salesman_visit_logs, salesman_live_locations,
#           live_locations (old service model)

class TrackingSession(Base):
    """
    One tracking session per user per day, linked to attendance.
    Lifecycle: Attendance check-in → Session ACTIVE → GPS + Visits → ENDED at 6:30 PM or manual.
    """
    __tablename__ = "tracking_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attendance_id = Column(Integer, ForeignKey("attendance.id"), nullable=True)
    role = Column(String(50), nullable=False)
    check_in_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    check_out_time = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE | ENDED
    session_date = Column(Date, nullable=False, index=True)
    auto_stopped = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'session_date', name='uq_tracking_user_session_date'),
    )

    user = relationship("User", foreign_keys=[user_id])
    attendance = relationship("Attendance", foreign_keys=[attendance_id])
    visits = relationship("VisitLog", back_populates="session", order_by="VisitLog.sequence_no")
    route = relationship("RouteSummary", back_populates="session", uselist=False)


class UnifiedLiveLocation(Base):
    """
    Real-time GPS position — ONE row per user (UPSERT model).
    Must reference an active TrackingSession.
    Used for admin live map markers only — NOT for route calculation.
    """
    __tablename__ = "unified_live_locations"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    session_id = Column(Integer, ForeignKey("tracking_sessions.id"), nullable=True)
    latitude = Column(Float, nullable=False, default=0)
    longitude = Column(Float, nullable=False, default=0)
    accuracy = Column(Float, default=0)
    is_active = Column(Boolean, default=True, index=True)
    last_updated = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    session = relationship("TrackingSession", foreign_keys=[session_id])


class VisitLog(Base):
    """
    Ordered visit points within a tracking session.
    Routes are ALWAYS calculated from this table.
    sequence_no is atomic per session (enforced via row-level lock).
    """
    __tablename__ = "visit_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("tracking_sessions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sequence_no = Column(Integer, nullable=False)
    customer_name = Column(String(255))
    notes = Column(Text)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, default=0)
    address = Column(Text)
    visit_type = Column(String(50), default="customer_visit")
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)
    distance_from_prev_km = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('session_id', 'sequence_no', name='uq_visit_session_sequence'),
    )

    session = relationship("TrackingSession", back_populates="visits")
    user = relationship("User", foreign_keys=[user_id])


class RouteSummary(Base):
    """
    Route summary generated on session end.
    Built exclusively from VisitLog points within the session.
    """
    __tablename__ = "route_summary"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("tracking_sessions.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_distance_km = Column(Float, nullable=False, default=0)
    total_visits = Column(Integer, default=0)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    polyline = Column(Text)  # JSON array of [lat, lng] pairs
    generated_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("TrackingSession", back_populates="route")
    user = relationship("User", foreign_keys=[user_id])


# ============= GEOFENCING & DEVICE MONITORING MODELS =============

class Geofence(Base):
    __tablename__ = "geofences"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), default="office")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius = Column(Integer, default=100)
    allow_attendance = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class GeofenceEvent(Base):
    __tablename__ = "geofence_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    geofence_id = Column(String(50))
    geofence_name = Column(String(100))
    geofence_type = Column(String(50))
    event_type = Column(String(20), nullable=False)
    event_time = Column(DateTime, default=datetime.utcnow)


class DeviceStatusLog(Base):
    __tablename__ = "device_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String(50))
    message = Column(Text)
    battery_level = Column(Integer)
    battery_charging = Column(Boolean)
    gps_enabled = Column(Boolean)
    gps_accuracy = Column(Float)
    is_online = Column(Boolean)
    network_type = Column(String(20))
    logged_at = Column(DateTime, default=datetime.utcnow)


# ============= COMMUNICATION QUEUE & STAFF NOTIFICATIONS =============

class CommunicationQueue(Base):
    __tablename__ = "communication_queue"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(20), nullable=False, default="WHATSAPP")       # WHATSAPP / SMS / EMAIL
    recipient_type = Column(String(20), nullable=False, default="CUSTOMER") # CUSTOMER / STAFF
    recipient_phone = Column(String(30))
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_type = Column(String(80), nullable=False)
    reference_table = Column(String(80))
    reference_id = Column(Integer)
    message_payload_json = Column(Text)                                     # JSON blob
    status = Column(String(20), nullable=False, default="QUEUED")           # QUEUED / PROCESSING / SENT / FAILED
    retry_count = Column(Integer, nullable=False, default=0)
    last_error = Column(Text)
    idempotency_key = Column(String(200), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    next_retry_at = Column(DateTime, nullable=True)


class StaffNotification(Base):
    __tablename__ = "staff_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    module = Column(String(80))
    entity_type = Column(String(80))
    entity_id = Column(Integer)
    priority = Column(String(20), nullable=False, default="NORMAL")         # LOW / NORMAL / HIGH / URGENT
    is_read = Column(Boolean, nullable=False, default=False)
    action_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
