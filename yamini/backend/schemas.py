from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Union
from datetime import datetime, date
from models import UserRole  # OFFICE_STAFF removed - merged into RECEPTION

# User Schemas
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: UserRole
    department: Optional[str] = None
    
    # Personal Information
    gender: Optional[str] = None
    date_of_birth: Optional[Union[date, str]] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None
    
    # Identification / KYC
    employee_id: Optional[str] = None
    nationality: Optional[str] = "Indian"
    photograph: Optional[str] = None
    
    # Employment Details
    date_of_joining: Optional[Union[date, str]] = None
    
    # Salary & Payroll
    salary: Optional[float] = None
    monthly_pay: Optional[float] = None
    bank_name: Optional[str] = None
    bank: Optional[str] = None
    account_number: Optional[str] = None
    bank_account: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Personal Information
    gender: Optional[str] = None
    date_of_birth: Optional[Union[date, str]] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None
    
    # Identification / KYC
    employee_id: Optional[str] = None
    nationality: Optional[str] = None
    photograph: Optional[str] = None
    
    # Employment Details
    date_of_joining: Optional[Union[date, str]] = None
    
    # Salary & Payroll
    salary: Optional[float] = None
    monthly_pay: Optional[float] = None
    bank_name: Optional[str] = None
    bank: Optional[str] = None
    account_number: Optional[str] = None
    bank_account: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    customer_id: str
    status: str
    total_purchases: int
    total_value: float
    amc_status: Optional[str]
    amc_expiry: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Enquiry Schemas
class EnquiryBase(BaseModel):
    customer_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    product_interest: Optional[str] = None
    priority: str = "WARM"
    notes: Optional[str] = None

class EnquiryCreate(EnquiryBase):
    product_id: Optional[int] = None  # Link to product table
    source: Optional[str] = "website"
    description: Optional[str] = None
    assigned_to: Optional[int] = None  # Allow assignment during creation

class EnquiryUpdate(BaseModel):
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    next_follow_up: Optional[datetime] = None
    notes: Optional[str] = None

class Enquiry(EnquiryBase):
    id: int
    enquiry_id: str
    status: str
    assigned_to: Optional[int]
    product_id: Optional[int] = None
    product_name: Optional[str] = None  # Enriched from product table
    assigned_salesman_name: Optional[str] = None  # Enriched from user table
    address: Optional[str] = None  # Enriched from customer table
    source: Optional[str] = None
    next_follow_up: Optional[datetime]
    last_follow_up: Optional[datetime]
    created_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True

# Complaint/Service Request Schemas
class ComplaintBase(BaseModel):
    customer_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    machine_model: Optional[str] = None
    fault_description: str
    priority: str = "NORMAL"  # NORMAL, URGENT, CRITICAL

class ComplaintCreate(ComplaintBase):
    customer_id: Optional[int] = None
    assigned_to: Optional[int] = None

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None  # ASSIGNED, ON_THE_WAY, IN_PROGRESS, ON_HOLD, COMPLETED
    resolution_notes: Optional[str] = None
    parts_replaced: Optional[str] = None
    assigned_to: Optional[int] = None
    checkin_latitude: Optional[float] = None
    checkin_longitude: Optional[float] = None
    checkin_time: Optional[str] = None

class ServiceCompleteRequest(BaseModel):
    resolution_notes: str
    parts_replaced: Optional[str] = None

class Complaint(ComplaintBase):
    id: int
    ticket_no: str
    status: str
    assigned_to: Optional[int]
    engineer_name: Optional[str] = None  # Added for frontend display
    sla_time: Optional[datetime]
    sla_warning_sent: bool
    sla_breach_sent: bool
    created_at: datetime
    completed_at: Optional[datetime]
    resolution_notes: Optional[str] = None
    parts_replaced: Optional[str] = None
    feedback_url: Optional[str] = None
    feedback_qr: Optional[str] = None
    checkin_latitude: Optional[float] = None
    checkin_longitude: Optional[float] = None
    checkin_time: Optional[datetime] = None
    sla_status: Optional[dict] = None  # Dynamic SLA status info
    sla_remaining: Optional[int] = None  # Remaining seconds
    
    class Config:
        from_attributes = True

# Feedback Schemas
class FeedbackBase(BaseModel):
    rating: int  # 1-5
    comment: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    service_request_id: int
    customer_name: str

class Feedback(FeedbackBase):
    id: int
    service_request_id: int
    customer_name: str
    is_negative: bool
    escalated: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Booking Schemas
class BookingBase(BaseModel):
    service_type: str
    machine_model: Optional[str] = None
    description: str
    preferred_date: datetime
    urgency: str = "normal"

class BookingCreate(BookingBase):
    customer_id: Optional[int] = None

class Booking(BookingBase):
    id: int
    booking_id: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# MIF Schemas
class MIFRecordBase(BaseModel):
    customer_name: str
    machine_model: str
    serial_number: str
    installation_date: datetime
    location: str
    machine_value: float
    amc_status: Optional[str]
    amc_expiry: Optional[datetime]
    engineer_name: Optional[str] = None

class MIFRecordCreate(MIFRecordBase):
    customer_id: Optional[int] = None

class MIFRecordUpdate(BaseModel):
    customer_name: Optional[str] = None
    machine_model: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[datetime] = None
    location: Optional[str] = None
    machine_value: Optional[float] = None
    amc_status: Optional[str] = None
    amc_expiry: Optional[datetime] = None
    last_service: Optional[datetime] = None
    next_service: Optional[datetime] = None
    status: Optional[str] = None
    engineer_name: Optional[str] = None

class MIFRecord(MIFRecordBase):
    id: int
    mif_id: str
    last_service: Optional[datetime]
    next_service: Optional[datetime]
    services_done: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class MIFAccessLogCreate(BaseModel):
    action: str
    ip_address: Optional[str] = None

# Sales Schemas
class SalesCallCreate(BaseModel):
    customer_name: str
    phone: str
    call_type: str
    outcome: str
    notes: Optional[str] = None

class ShopVisitCreate(BaseModel):
    customer_name: str
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    customer_contact: Optional[str] = None
    location: str
    requirements: str
    requirement_details: Optional[str] = None
    product_interest: Optional[str] = None
    expected_closing: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    visit_type: str = "New"
    notes: Optional[str] = None

# Attendance Schema
class AttendanceCreate(BaseModel):
    time: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_path: Optional[str] = None
    status: str = "Present"

class Attendance(BaseModel):
    id: int
    employee_id: int
    date: datetime
    time: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_path: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# Follow-up Schemas (Single source - merged from FollowUpHistory + EnquiryNote)
class FollowUpCreate(BaseModel):
    enquiry_id: int
    note: str
    note_type: str = "follow_up"  # call, meeting, follow_up, visit, general
    followup_date: datetime
    status: str = "Pending"

class FollowUpUpdate(BaseModel):
    note: Optional[str] = None
    note_type: Optional[str] = None
    status: Optional[str] = None
    completed_at: Optional[datetime] = None

class FollowUp(BaseModel):
    id: int
    enquiry_id: int
    salesman_id: int
    note: str
    note_type: str
    followup_date: datetime
    status: str
    created_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

# Daily Report Schemas
class DailyReportCreate(BaseModel):
    """Schema for submitting daily report - only manual fields"""
    achievements: str  # Required: Today's achievements
    challenges: str    # Required: Challenges faced
    tomorrow_plan: str # Required: Plan for tomorrow
    report_notes: Optional[str] = None  # Optional additional notes

class DailyReportPrefill(BaseModel):
    """Schema for prefilling daily report with auto-derived metrics"""
    date: date
    attendance_marked: bool
    attendance_id: Optional[int] = None
    already_submitted: bool
    existing_report_id: Optional[int] = None
    
    # Auto-derived metrics (backend calculated)
    calls_made: int = 0
    meetings_done: int = 0  # From visits table
    orders_closed: int = 0  # From converted enquiries
    
    # If already submitted, include the data
    achievements: Optional[str] = None
    challenges: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    submission_time: Optional[datetime] = None

class DailyReport(BaseModel):
    """Schema for daily report response"""
    id: int
    salesman_id: int
    report_date: date
    
    # Auto-derived metrics
    calls_made: int
    shops_visited: int
    enquiries_generated: int
    sales_closed: int
    
    # Manual input fields
    achievements: Optional[str] = None
    challenges: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    report_notes: Optional[str] = None
    
    # Metadata
    report_submitted: bool
    submission_time: Optional[datetime] = None
    attendance_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Product & Service Schemas
class ProductCreate(BaseModel):
    name: str
    category: str
    model: Optional[str] = None
    brand: Optional[str] = None
    price: float
    stock_quantity: int = 0
    description: Optional[str] = None
    features: Optional[str] = None

class ServiceCreate(BaseModel):
    name: str
    service_type: str
    price: float
    duration: str
    description: Optional[str] = None

# Notification Schema
class NotificationCreate(BaseModel):
    user_id: int
    notification_type: str
    title: str
    message: str
    priority: str
    module: str
    action_url: Optional[str] = None

class Notification(BaseModel):
    id: int
    notification_type: str
    title: str
    message: str
    priority: str
    module: str
    action_url: Optional[str]
    read_status: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderCreate(BaseModel):
    enquiry_id: int
    quantity: int
    expected_delivery_date: Optional[datetime] = None
    discount_percent: float = 0
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    quantity: Optional[int] = None
    expected_delivery_date: Optional[datetime] = None
    discount_percent: Optional[float] = None
    notes: Optional[str] = None

class OrderApprove(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

class Order(BaseModel):
    id: int
    order_id: str
    enquiry_id: Optional[int] = None
    salesman_id: Optional[int] = None
    customer_id: Optional[int] = None
    product_id: Optional[int] = None
    customer_name: str
    product_name: str
    quantity: int
    unit_price: float
    discount_percent: float
    discount_amount: float
    total_amount: float
    expected_delivery_date: Optional[datetime]
    notes: Optional[str]
    status: str
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    invoice_number: Optional[str]
    invoice_generated: bool
    stock_deducted: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# DailyReport schemas already defined above - SalesDailyReport removed (duplicate)

# Salesman Analytics Schemas
class SalesmanAnalytics(BaseModel):
    assigned_enquiries: int
    pending_followups: int
    converted_enquiries: int
    revenue_this_month: float
    missed_followups: int
    orders_pending_approval: int
    conversion_rate: float
    avg_closing_days: float

class SalesmanPerformance(BaseModel):
    salesman_id: int
    salesman_name: str
    assigned: int
    converted: int
    conversion_rate: float
    revenue: float
    avg_closing_days: float
    missed_followups: int
    visit_count: int
    lost_count: int

class SalesFunnelData(BaseModel):
    new: int
    contacted: int
    followup: int
    quoted: int
    converted: int
    lost: int

# Service Engineer Daily Report Schemas
class ServiceEngineerDailyReportBase(BaseModel):
    jobs_completed: int
    jobs_pending: int
    issues_faced: Optional[str] = None
    remarks: Optional[str] = None

class ServiceEngineerDailyReportCreate(ServiceEngineerDailyReportBase):
    pass

class ServiceEngineerDailyReport(ServiceEngineerDailyReportBase):
    id: int
    engineer_id: int
    report_date: datetime
    submitted_at: datetime
    
    class Config:
        from_attributes = True


# ===========================
# CHATBOT SCHEMAS
# ===========================

class ChatbotKnowledgeBase(BaseModel):
    title: str
    content: str
    content_en: Optional[str] = None
    content_ta: Optional[str] = None
    category: str  # faq, product, service, amc, policy
    subcategory: Optional[str] = None
    keywords: Optional[str] = None

class ChatbotKnowledgeCreate(ChatbotKnowledgeBase):
    pass

class ChatbotKnowledgeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    content_en: Optional[str] = None
    content_ta: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    keywords: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None

class ChatbotKnowledge(ChatbotKnowledgeBase):
    id: int
    is_active: bool
    priority: int
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None  # For continuing conversation
    message: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    language: Optional[str] = "en"  # en or ta

class ChatMessageResponse(BaseModel):
    session_id: str
    reply: str
    confidence: float
    intent: Optional[str] = None
    handoff_needed: bool = False
    enquiry_created: bool = False
    enquiry_id: Optional[int] = None
    suggestions: Optional[List[str]] = None  # Quick reply suggestions

class ChatSessionInfo(BaseModel):
    session_id: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    language: str
    status: str
    message_count: int
    started_at: datetime
    last_message_at: datetime
    
    class Config:
        from_attributes = True

class ChatHandoffRequest(BaseModel):
    session_id: str
    reason: str

class ChatHandoffInfo(BaseModel):
    id: int
    session_id: int
    customer_name: Optional[str]
    customer_phone: Optional[str]
    reason: str
    priority: str
    status: str
    summary: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
