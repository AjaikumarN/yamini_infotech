"""
WhatsApp Notification Service for Customer-Only Transactional Messages
======================================================================

This service handles automated WhatsApp notifications to CUSTOMERS ONLY.
Uses PyWhatKit for WhatsApp Web automation (no paid APIs).

RULES:
- Customer phone numbers ONLY (never staff)
- Triggered ONLY by backend after DB commit
- Idempotent: One message per event (flags prevent duplicates)
- One-way notifications (no replies expected)
- Enterprise-grade messaging style

EVENTS SUPPORTED:
1. Enquiry Created
2. Service/Booking Created
3. Engineer Assigned
4. Service Completed (QR + Feedback)
5. Delivery Failed
6. Delivery Re-attempt Scheduled
"""

import os
import re
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import text

# Configure logging
logger = logging.getLogger(__name__)

# Try to import pywhatkit, fallback to mock if not available
try:
    import pywhatkit as kit
    PYWHATKIT_AVAILABLE = True
    logger.info("✅ PyWhatKit loaded successfully")
except ImportError:
    PYWHATKIT_AVAILABLE = False
    logger.warning("⚠️ PyWhatKit not installed. Run: pip install pywhatkit")


class WhatsAppEventType(str, Enum):
    """WhatsApp notification event types"""
    ENQUIRY_CREATED = "enquiry_created"
    SERVICE_CREATED = "service_created"
    ENGINEER_ASSIGNED = "engineer_assigned"
    SERVICE_COMPLETED = "service_completed"
    DELIVERY_FAILED = "delivery_failed"
    DELIVERY_REATTEMPT = "delivery_reattempt"


class WhatsAppMessageTemplates:
    """Professional message templates for customer notifications"""
    
    @staticmethod
    def enquiry_created(customer_name: str, enquiry_id: str, subject: str) -> str:
        return f"""Hello {customer_name},

✅ We have received your enquiry.

🆔 Enquiry ID: {enquiry_id}
📋 Subject: {subject}

Our team will contact you shortly.

— Yamini Infotech"""

    @staticmethod
    def service_created(customer_name: str, ticket_id: str, service_type: str, 
                       scheduled_date: str, tracking_link: str) -> str:
        return f"""Hello {customer_name},

✅ Your service request has been registered successfully.

🆔 Ticket ID: {ticket_id}
🔧 Service: {service_type}
📅 Requested Date: {scheduled_date}

You can track your service here 👇
{tracking_link}

— Yamini Infotech"""

    @staticmethod
    def engineer_assigned(customer_name: str, ticket_id: str, engineer_name: str) -> str:
        return f"""Hello {customer_name},

👨‍🔧 An engineer has been assigned to your service request.

🆔 Ticket ID: {ticket_id}
👨‍🔧 Engineer: {engineer_name}

Our engineer will contact you if required.

— Yamini Infotech"""

    @staticmethod
    def service_completed(customer_name: str, ticket_id: str, 
                         completed_date: str, feedback_link: str) -> str:
        return f"""Hello {customer_name},

✅ Service completed successfully.

🆔 Ticket ID: {ticket_id}
📅 Completed On: {completed_date}

Please confirm the service & share your feedback 👇
{feedback_link}

— Yamini Infotech"""

    @staticmethod
    def delivery_failed(customer_name: str, reference_id: str, item_name: str) -> str:
        return f"""Hi {customer_name},

We couldn't reach you today for delivery of your item/service.

🆔 Reference: {reference_id}
📦 Item/Service: {item_name}

We'll try again on the next working day.
Please ensure availability or contact us if needed.

— Yamini Infotech"""

    @staticmethod
    def delivery_reattempt(customer_name: str) -> str:
        return f"""Hello {customer_name},

Thank you for the update.

📦 Your delivery/service will be re-attempted on the next working day.

We appreciate your cooperation.

— Yamini Infotech"""


class WhatsAppService:
    """
    WhatsApp Notification Service
    
    Sends transactional messages to CUSTOMERS ONLY via WhatsApp Web automation.
    """
    
    def __init__(self):
        self.enabled = PYWHATKIT_AVAILABLE and os.getenv("WHATSAPP_ENABLED", "true").lower() == "true"
        self.retry_queue = []
        self.max_retries = 3
        
    def _normalize_phone(self, phone: str) -> Optional[str]:
        """
        Normalize phone number to international format.
        Returns None if invalid.
        
        Expected format: +91XXXXXXXXXX (India)
        """
        if not phone:
            return None
            
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        
        # Handle Indian phone numbers
        if len(digits) == 10:
            # Add India country code
            return f"+91{digits}"
        elif len(digits) == 12 and digits.startswith("91"):
            return f"+{digits}"
        elif len(digits) == 11 and digits.startswith("0"):
            # Remove leading 0 and add country code
            return f"+91{digits[1:]}"
        elif len(digits) >= 10 and len(digits) <= 15:
            # Already has country code
            return f"+{digits}" if not digits.startswith("+") else digits
        
        logger.warning(f"Invalid phone number format: {phone}")
        return None
    
    def _is_valid_customer_phone(self, phone: str, db: Session) -> bool:
        """
        Verify phone belongs to a customer, NOT staff.
        This is a safety check to prevent messaging employees.
        """
        if not phone:
            return False
            
        normalized = self._normalize_phone(phone)
        if not normalized:
            return False
        
        # Check if this phone belongs to any staff member
        staff_check = db.execute(text("""
            SELECT COUNT(*) FROM users 
            WHERE (phone = :phone OR mobile = :phone)
            AND role IN ('ADMIN', 'RECEPTION', 'SALESMAN', 'SERVICE_ENGINEER')
        """), {"phone": phone}).scalar()
        
        if staff_check > 0:
            logger.warning(f"⚠️ Phone {phone} belongs to staff. NOT sending WhatsApp.")
            return False
            
        return True
    
    def _check_idempotency(self, db: Session, table: str, record_id: int, 
                          flag_column: str) -> bool:
        """
        Check if message was already sent (idempotency check).
        Returns True if already sent, False if not sent yet.
        """
        try:
            result = db.execute(text(f"""
                SELECT {flag_column} FROM {table} WHERE id = :id
            """), {"id": record_id}).scalar()
            
            return result == True
        except Exception as e:
            logger.error(f"Idempotency check failed: {e}")
            return False  # Proceed with caution
    
    def _set_sent_flag(self, db: Session, table: str, record_id: int, 
                      flag_column: str) -> bool:
        """Set the sent flag to prevent duplicate messages."""
        try:
            db.execute(text(f"""
                UPDATE {table} SET {flag_column} = TRUE WHERE id = :id
            """), {"id": record_id})
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to set sent flag: {e}")
            db.rollback()
            return False
    
    def _log_message(self, db: Session, event_type: str, customer_phone: str,
                    customer_name: str, message: str, status: str,
                    reference_type: str = None, reference_id: int = None,
                    error_message: str = None):
        """Log WhatsApp message to audit table."""
        try:
            db.execute(text("""
                INSERT INTO whatsapp_message_logs 
                (event_type, customer_phone, customer_name, message_content, 
                 status, reference_type, reference_id, error_message, created_at)
                VALUES (:event_type, :phone, :name, :message, :status, 
                        :ref_type, :ref_id, :error, :created_at)
            """), {
                "event_type": event_type,
                "phone": customer_phone,
                "name": customer_name,
                "message": message,
                "status": status,
                "ref_type": reference_type,
                "ref_id": reference_id,
                "error": error_message,
                "created_at": datetime.utcnow()
            })
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log WhatsApp message: {e}")
            db.rollback()
    
    def _send_whatsapp_message(self, phone: str, message: str) -> tuple[bool, str]:
        """
        Send WhatsApp message using PyWhatKit.
        Returns (success, error_message)
        """
        if not self.enabled:
            logger.info(f"WhatsApp disabled. Would send to {phone}: {message[:50]}...")
            return True, None
            
        if not PYWHATKIT_AVAILABLE:
            return False, "PyWhatKit not installed"
        
        try:
            # Normalize phone number
            normalized_phone = self._normalize_phone(phone)
            if not normalized_phone:
                return False, "Invalid phone number"
            
            # Calculate send time (1 minute from now to allow WhatsApp Web to load)
            now = datetime.now()
            send_time = now + timedelta(minutes=1)
            
            # Send using pywhatkit (instant send)
            # Note: This opens WhatsApp Web and sends the message
            kit.sendwhatmsg_instantly(
                phone_no=normalized_phone,
                message=message,
                wait_time=15,  # Wait 15 seconds for WhatsApp Web to load
                tab_close=True,
                close_time=3
            )
            
            logger.info(f"✅ WhatsApp sent to {normalized_phone}")
            return True, None
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"❌ WhatsApp send failed: {error_msg}")
            return False, error_msg
    
    # =========================================================================
    # EVENT HANDLERS
    # =========================================================================
    
    def send_enquiry_created(self, db: Session, enquiry) -> bool:
        """
        Send WhatsApp notification when enquiry is created.
        
        Args:
            db: Database session
            enquiry: Enquiry model object
        """
        # Idempotency check
        if self._check_idempotency(db, "enquiries", enquiry.id, "whatsapp_enquiry_sent"):
            logger.info(f"Enquiry {enquiry.id} WhatsApp already sent. Skipping.")
            return False
        
        # Validate customer phone
        if not self._is_valid_customer_phone(enquiry.phone, db):
            logger.warning(f"Invalid/staff phone for enquiry {enquiry.id}")
            return False
        
        # Build message
        message = WhatsAppMessageTemplates.enquiry_created(
            customer_name=enquiry.customer_name or "Customer",
            enquiry_id=enquiry.enquiry_id or f"ENQ-{enquiry.id}",
            subject=enquiry.product_interest or "Product Enquiry"
        )
        
        # Send message
        success, error = self._send_whatsapp_message(enquiry.phone, message)
        
        # Log message
        self._log_message(
            db=db,
            event_type=WhatsAppEventType.ENQUIRY_CREATED,
            customer_phone=enquiry.phone,
            customer_name=enquiry.customer_name,
            message=message,
            status="SENT" if success else "FAILED",
            reference_type="enquiry",
            reference_id=enquiry.id,
            error_message=error
        )
        
        # Set sent flag
        if success:
            self._set_sent_flag(db, "enquiries", enquiry.id, "whatsapp_enquiry_sent")
        
        return success
    
    def send_service_created(self, db: Session, complaint, tracking_link: str = None) -> bool:
        """
        Send WhatsApp notification when service/complaint is created.
        """
        # Idempotency check
        if self._check_idempotency(db, "complaints", complaint.id, "whatsapp_service_created_sent"):
            logger.info(f"Service {complaint.id} creation WhatsApp already sent. Skipping.")
            return False
        
        # Validate customer phone
        if not self._is_valid_customer_phone(complaint.phone, db):
            logger.warning(f"Invalid/staff phone for complaint {complaint.id}")
            return False
        
        # Build tracking link
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        if not tracking_link:
            tracking_link = f"{frontend_url}/track/{complaint.ticket_no or complaint.id}"
        
        # Format scheduled date
        scheduled_date = "To be scheduled"
        if hasattr(complaint, 'sla_time') and complaint.sla_time:
            scheduled_date = complaint.sla_time.strftime("%d/%m/%Y")
        
        # Build message
        message = WhatsAppMessageTemplates.service_created(
            customer_name=complaint.customer_name or "Customer",
            ticket_id=complaint.ticket_no or f"SRV-{complaint.id}",
            service_type=complaint.machine_model or "Service Request",
            scheduled_date=scheduled_date,
            tracking_link=tracking_link
        )
        
        # Send message
        success, error = self._send_whatsapp_message(complaint.phone, message)
        
        # Log message
        self._log_message(
            db=db,
            event_type=WhatsAppEventType.SERVICE_CREATED,
            customer_phone=complaint.phone,
            customer_name=complaint.customer_name,
            message=message,
            status="SENT" if success else "FAILED",
            reference_type="complaint",
            reference_id=complaint.id,
            error_message=error
        )
        
        # Set sent flag
        if success:
            self._set_sent_flag(db, "complaints", complaint.id, "whatsapp_service_created_sent")
        
        return success
    
    def send_engineer_assigned(self, db: Session, complaint, engineer_name: str) -> bool:
        """
        Send WhatsApp notification when engineer is assigned.
        """
        # Idempotency check
        if self._check_idempotency(db, "complaints", complaint.id, "whatsapp_engineer_assigned_sent"):
            logger.info(f"Service {complaint.id} engineer assignment WhatsApp already sent. Skipping.")
            return False
        
        # Validate customer phone
        if not self._is_valid_customer_phone(complaint.phone, db):
            logger.warning(f"Invalid/staff phone for complaint {complaint.id}")
            return False
        
        # Build message
        message = WhatsAppMessageTemplates.engineer_assigned(
            customer_name=complaint.customer_name or "Customer",
            ticket_id=complaint.ticket_no or f"SRV-{complaint.id}",
            engineer_name=engineer_name
        )
        
        # Send message
        success, error = self._send_whatsapp_message(complaint.phone, message)
        
        # Log message
        self._log_message(
            db=db,
            event_type=WhatsAppEventType.ENGINEER_ASSIGNED,
            customer_phone=complaint.phone,
            customer_name=complaint.customer_name,
            message=message,
            status="SENT" if success else "FAILED",
            reference_type="complaint",
            reference_id=complaint.id,
            error_message=error
        )
        
        # Set sent flag
        if success:
            self._set_sent_flag(db, "complaints", complaint.id, "whatsapp_engineer_assigned_sent")
        
        return success
    
    def send_service_completed(self, db: Session, complaint, feedback_link: str = None) -> bool:
        """
        Send WhatsApp notification when service is completed (QR flow).
        ONLY triggered after QR scan / DB commit for completion.
        """
        # Idempotency check
        if self._check_idempotency(db, "complaints", complaint.id, "whatsapp_service_completed_sent"):
            logger.info(f"Service {complaint.id} completion WhatsApp already sent. Skipping.")
            return False
        
        # Validate customer phone
        if not self._is_valid_customer_phone(complaint.phone, db):
            logger.warning(f"Invalid/staff phone for complaint {complaint.id}")
            return False
        
        # Build feedback link
        if not feedback_link and hasattr(complaint, 'feedback_url'):
            feedback_link = complaint.feedback_url
        if not feedback_link:
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            feedback_link = f"{frontend_url}/feedback/{complaint.id}"
        
        # Format completed date
        completed_date = datetime.utcnow().strftime("%d/%m/%Y")
        if hasattr(complaint, 'completed_at') and complaint.completed_at:
            completed_date = complaint.completed_at.strftime("%d/%m/%Y")
        
        # Build message
        message = WhatsAppMessageTemplates.service_completed(
            customer_name=complaint.customer_name or "Customer",
            ticket_id=complaint.ticket_no or f"SRV-{complaint.id}",
            completed_date=completed_date,
            feedback_link=feedback_link
        )
        
        # Send message
        success, error = self._send_whatsapp_message(complaint.phone, message)
        
        # Log message
        self._log_message(
            db=db,
            event_type=WhatsAppEventType.SERVICE_COMPLETED,
            customer_phone=complaint.phone,
            customer_name=complaint.customer_name,
            message=message,
            status="SENT" if success else "FAILED",
            reference_type="complaint",
            reference_id=complaint.id,
            error_message=error
        )
        
        # Set sent flag
        if success:
            self._set_sent_flag(db, "complaints", complaint.id, "whatsapp_service_completed_sent")
        
        return success
    
    def send_delivery_failed(self, db: Session, stock_movement, customer_phone: str,
                            customer_name: str) -> bool:
        """
        Send WhatsApp notification when delivery fails.
        """
        # Idempotency check
        if self._check_idempotency(db, "stock_movements", stock_movement.id, 
                                   "whatsapp_delivery_failed_sent"):
            logger.info(f"Delivery {stock_movement.id} failure WhatsApp already sent. Skipping.")
            return False
        
        # Validate customer phone
        if not self._is_valid_customer_phone(customer_phone, db):
            logger.warning(f"Invalid/staff phone for delivery {stock_movement.id}")
            return False
        
        # Build message
        message = WhatsAppMessageTemplates.delivery_failed(
            customer_name=customer_name or "Customer",
            reference_id=stock_movement.reference_id or f"DEL-{stock_movement.id}",
            item_name=stock_movement.item_name or "Item"
        )
        
        # Send message
        success, error = self._send_whatsapp_message(customer_phone, message)
        
        # Log message
        self._log_message(
            db=db,
            event_type=WhatsAppEventType.DELIVERY_FAILED,
            customer_phone=customer_phone,
            customer_name=customer_name,
            message=message,
            status="SENT" if success else "FAILED",
            reference_type="stock_movement",
            reference_id=stock_movement.id,
            error_message=error
        )
        
        # Set sent flag
        if success:
            self._set_sent_flag(db, "stock_movements", stock_movement.id, 
                               "whatsapp_delivery_failed_sent")
        
        return success
    
    def send_delivery_reattempt(self, db: Session, stock_movement, customer_phone: str,
                               customer_name: str) -> bool:
        """
        Send WhatsApp notification when delivery re-attempt is scheduled.
        """
        # Idempotency check
        if self._check_idempotency(db, "stock_movements", stock_movement.id, 
                                   "whatsapp_delivery_reattempt_sent"):
            logger.info(f"Delivery {stock_movement.id} reattempt WhatsApp already sent. Skipping.")
            return False
        
        # Validate customer phone
        if not self._is_valid_customer_phone(customer_phone, db):
            logger.warning(f"Invalid/staff phone for delivery {stock_movement.id}")
            return False
        
        # Build message
        message = WhatsAppMessageTemplates.delivery_reattempt(
            customer_name=customer_name or "Customer"
        )
        
        # Send message
        success, error = self._send_whatsapp_message(customer_phone, message)
        
        # Log message
        self._log_message(
            db=db,
            event_type=WhatsAppEventType.DELIVERY_REATTEMPT,
            customer_phone=customer_phone,
            customer_name=customer_name,
            message=message,
            status="SENT" if success else "FAILED",
            reference_type="stock_movement",
            reference_id=stock_movement.id,
            error_message=error
        )
        
        # Set sent flag
        if success:
            self._set_sent_flag(db, "stock_movements", stock_movement.id, 
                               "whatsapp_delivery_reattempt_sent")
        
        return success


# Singleton instance
whatsapp_service = WhatsAppService()
