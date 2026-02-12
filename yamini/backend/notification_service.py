"""
Centralized Notification Service for ERP System
Handles all notification creation and delivery across the application

PHASE 4: NOTIFICATION SYSTEM ALIGNMENT
- Unified notification creation
- Role-based notification routing
- Priority-based alerting
- Action URL generation with notification_routes.py
"""

from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
import models
import logging
from notification_routes import NotificationType, NotificationRouter

logger = logging.getLogger(__name__)


class NotificationService:
    """Centralized notification service for the ERP system"""
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        priority: str = "medium",
        module: str = None,
        action_url: str = None
    ) -> models.Notification:
        """
        Create a notification for a specific user
        
        Args:
            db: Database session
            user_id: Target user ID
            title: Notification title
            message: Notification message
            notification_type: Type (enquiry, order, complaint, reminder, etc.)
            priority: Priority level (low, medium, high, critical)
            module: Module name (optional)
            action_url: URL for action (optional)
        
        Returns:
            Created notification object
        """
        try:
            notification = models.Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                module=module,
                action_url=action_url,
                created_at=datetime.utcnow()
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)
            logger.info(f"Notification created for user {user_id}: {title}")
            return notification
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create notification: {e}")
            raise
    
    @staticmethod
    def notify_enquiry_created(
        db: Session,
        enquiry: models.Enquiry,
        created_by_name: str
    ):
        """
        Notify when a new enquiry is created
        - Notify assigned salesman
        - Notify admin
        """
        notifications_created = []
        
        # Notify assigned salesman
        if enquiry.assigned_to:
            notification = NotificationService.create_notification(
                db=db,
                user_id=enquiry.assigned_to,
                title=f"New Enquiry Assigned: {enquiry.customer_name}",
                message=f"A new enquiry from {enquiry.customer_name} has been assigned to you by {created_by_name}. "
                       f"Priority: {enquiry.priority}. Follow up required.",
                notification_type="enquiry",
                priority="high" if enquiry.priority == "HOT" else "medium",
                module="enquiries",
                action_url=f"/enquiries/{enquiry.id}"
            )
            notifications_created.append(notification)
        
        # Notify admin about new enquiry
        admin_users = db.query(models.User).filter(
            models.User.role == models.UserRole.ADMIN
        ).all()
        
        for admin in admin_users:
            notification = NotificationService.create_notification(
                db=db,
                user_id=admin.id,
                title=f"New Enquiry: {enquiry.customer_name}",
                message=f"New enquiry created by {created_by_name}. "
                       f"Assigned to: {enquiry.assigned_to or 'Unassigned'}. "
                       f"Priority: {enquiry.priority}",
                notification_type="enquiry",
                priority="low",
                module="enquiries",
                action_url=f"/enquiries/{enquiry.id}"
            )
            notifications_created.append(notification)
        
        # Notify RECEPTION role (office staff) about new enquiry
        reception_users = db.query(models.User).filter(
            models.User.role == models.UserRole.RECEPTION,
            models.User.is_active == True
        ).all()
        
        for reception in reception_users:
            notification = NotificationService.create_notification(
                db=db,
                user_id=reception.id,
                title=f"New Enquiry: {enquiry.customer_name}",
                message=f"New enquiry submitted by {created_by_name}. "
                       f"Customer: {enquiry.customer_name}, Phone: {enquiry.phone}. "
                       f"Priority: {enquiry.priority}. Please review and assign.",
                notification_type="enquiry",
                priority="high" if created_by_name == "Website Visitor" else "medium",
                module="enquiries",
                action_url=f"/enquiries/{enquiry.id}"
            )
            notifications_created.append(notification)
        
        logger.info(f"Created {len(notifications_created)} notifications for enquiry {enquiry.id}")
        return notifications_created
    
    @staticmethod
    def notify_order_created(
        db: Session,
        order: models.Order,
        created_by_user: models.User
    ):
        """
        Notify when a new order is created
        - Notify admin for approval
        - Notify salesman (if different from creator)
        """
        notifications_created = []
        
        # Notify admin for order approval
        admin_users = db.query(models.User).filter(
            models.User.role == models.UserRole.ADMIN
        ).all()
        
        for admin in admin_users:
            notification = NotificationService.create_notification(
                db=db,
                user_id=admin.id,
                title=f"New Order Pending Approval: #{order.id}",
                message=f"Order created by {created_by_user.full_name} for customer ID {order.customer_id}. "
                       f"Amount: ₹{order.total_amount:.2f}. Requires approval.",
                notification_type="order",
                priority="high",
                module="orders",
                action_url=f"/orders/{order.id}/approve"
            )
            notifications_created.append(notification)
        
        # Notify salesman if order was created by someone else
        if order.salesman_id and order.salesman_id != created_by_user.id:
            notification = NotificationService.create_notification(
                db=db,
                user_id=order.salesman_id,
                title=f"Order Created for Your Customer: #{order.id}",
                message=f"An order has been created by {created_by_user.full_name} "
                       f"for customer ID {order.customer_id}. Amount: ₹{order.total_amount:.2f}",
                notification_type="order",
                priority="medium",
                module="orders",
                action_url=f"/orders/{order.id}"
            )
            notifications_created.append(notification)
        
        logger.info(f"Created {len(notifications_created)} notifications for order {order.id}")
        return notifications_created
    
    @staticmethod
    def notify_order_approved(
        db: Session,
        order: models.Order,
        approved_by: models.User
    ):
        """
        Notify when an order is approved
        - Notify salesman
        - Notify customer (if email available)
        """
        notifications_created = []
        
        # Notify salesman
        if order.salesman_id:
            notification = NotificationService.create_notification(
                db=db,
                user_id=order.salesman_id,
                title=f"Order Approved: #{order.id}",
                message=f"Your order #{order.id} has been approved by {approved_by.full_name}. "
                       f"Invoice: {order.invoice_number}. Stock deducted.",
                notification_type="order",
                priority="high",
                module="orders",
                action_url=f"/orders/{order.id}"
            )
            notifications_created.append(notification)
        
        logger.info(f"Created {len(notifications_created)} notifications for order approval {order.id}")
        return notifications_created
    
    @staticmethod
    def notify_order_rejected(
        db: Session,
        order: models.Order,
        rejected_by: models.User,
        reason: str
    ):
        """
        Notify when an order is rejected
        - Notify salesman
        """
        notifications_created = []
        
        # Notify salesman
        if order.salesman_id:
            notification = NotificationService.create_notification(
                db=db,
                user_id=order.salesman_id,
                title=f"Order Rejected: #{order.id}",
                message=f"Your order #{order.id} has been rejected by {rejected_by.full_name}. "
                       f"Reason: {reason}",
                notification_type="order",
                priority="high",
                module="orders",
                action_url=f"/orders/{order.id}"
            )
            notifications_created.append(notification)
        
        logger.info(f"Created {len(notifications_created)} notifications for order rejection {order.id}")
        return notifications_created
    
    @staticmethod
    def notify_daily_report_missing(
        db: Session,
        salesman: models.User,
        date: datetime
    ):
        """
        Notify salesman about missing daily report
        """
        notification = NotificationService.create_notification(
            db=db,
            user_id=salesman.id,
            title=f"Missing Daily Report for {date.strftime('%Y-%m-%d')}",
            message=f"You have not submitted your daily report for {date.strftime('%B %d, %Y')}. "
                   f"Please submit it as soon as possible.",
            notification_type="reminder",
            priority="high",
            module="reports",
            action_url="/salesman/daily-report"
        )
        
        logger.info(f"Sent missing report notification to salesman {salesman.id}")
        return notification
    
    @staticmethod
    def notify_followup_due(
        db: Session,
        salesman: models.User,
        followup: models.SalesFollowUp
    ):
        """
        Notify salesman about due follow-up
        """
        enquiry = db.query(models.Enquiry).filter(
            models.Enquiry.id == followup.enquiry_id
        ).first()
        
        if not enquiry:
            return None
        
        notification = NotificationService.create_notification(
            db=db,
            user_id=salesman.id,
            title=f"Follow-up Due: {enquiry.customer_name}",
            message=f"Follow-up is due for {enquiry.customer_name}. "
                   f"Status: {followup.status}. Temperature: {enquiry.temperature}",
            notification_type="reminder",
            priority="high" if enquiry.temperature == "HOT" else "medium",
            module="enquiries",
            action_url=f"/enquiries/{enquiry.id}/followups"
        )
        
        logger.info(f"Sent follow-up reminder to salesman {salesman.id}")
        return notification
    
    @staticmethod
    def notify_role_based(
        db: Session,
        roles: List[models.UserRole],
        title: str,
        message: str,
        notification_type: str,
        priority: str = "medium",
        module: str = None,
        action_url: str = None
    ) -> List[models.Notification]:
        """
        Send notifications to all users with specific roles
        
        Args:
            db: Database session
            roles: List of user roles to notify
            title: Notification title
            message: Notification message
            notification_type: Type of notification
            priority: Priority level
            module: Module name
            action_url: Action URL
        
        Returns:
            List of created notifications
        """
        notifications_created = []
        
        users = db.query(models.User).filter(
            models.User.role.in_(roles),
            models.User.is_active == True
        ).all()
        
        for user in users:
            notification = NotificationService.create_notification(
                db=db,
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                module=module,
                action_url=action_url
            )
            notifications_created.append(notification)
        
        logger.info(f"Created {len(notifications_created)} role-based notifications for roles {roles}")
        return notifications_created

    @staticmethod
    def notify_service_assigned(
        db: Session,
        service: models.Complaint,
        engineer_id: int
    ) -> models.Notification:
        """
        Notify service engineer when a service request is assigned
        
        Args:
            db: Database session
            service: Service request/complaint object
            engineer_id: Engineer user ID
        
        Returns:
            Created notification
        """
        priority_label = service.priority or "NORMAL"
        
        return NotificationService.create_notification(
            db=db,
            user_id=engineer_id,
            title=f"New {priority_label} Service Assigned",
            message=f"Service Request #{service.id} has been assigned to you. Customer: {service.customer_name}, Issue: {service.complaint_text[:100]}...",
            notification_type="service_assigned",
            priority="high" if priority_label == "CRITICAL" else "medium",
            module="service_engineer",
            action_url=f"/service-requests/{service.id}"
        )

    @staticmethod
    def notify_service_completed(
        db: Session,
        service: models.Complaint,
        engineer_name: str
    ) -> List[models.Notification]:
        """
        Notify admin and reception when a service is completed
        
        Args:
            db: Database session
            service: Service request/complaint object
            engineer_name: Name of the engineer who completed the service
        
        Returns:
            List of created notifications
        """
        return NotificationService.notify_role_based(
            db=db,
            roles=[models.UserRole.ADMIN, models.UserRole.RECEPTION],
            title=f"Service Request #{service.id} Completed",
            message=f"Engineer {engineer_name} has completed service for {service.customer_name}. Feedback link sent to customer.",
            notification_type="service_completed",
            priority="medium",
            module="service_engineer",
            action_url=f"/service-requests/{service.id}"
        )

    @staticmethod
    def notify_sla_breach(
        db: Session,
        service: models.Complaint
    ) -> List[models.Notification]:
        """
        Notify admin and reception when SLA is breached
        
        Args:
            db: Database session
            service: Service request/complaint object
        
        Returns:
            List of created notifications
        """
        engineer_name = "Unassigned"
        if service.assigned_to:
            engineer = db.query(models.User).filter(models.User.id == service.assigned_to).first()
            if engineer:
                engineer_name = engineer.full_name
        
        return NotificationService.notify_role_based(
            db=db,
            roles=[models.UserRole.ADMIN, models.UserRole.RECEPTION],
            title=f"⚠️ SLA BREACH - Service #{service.id}",
            message=f"URGENT: SLA breached for {service.priority} priority service. Customer: {service.customer_name}, Engineer: {engineer_name}",
            notification_type="sla_breach",
            priority="high",
            module="service_engineer",
            action_url=f"/service-requests/{service.id}"
        )

    @staticmethod
    def notify_negative_feedback(
        db: Session,
        service: models.Complaint,
        feedback
    ) -> List[models.Notification]:
        """
        Notify admin and reception when negative feedback is received
        
        Args:
            db: Database session
            service: Service request/complaint object
            feedback: Feedback object with rating
        
        Returns:
            List of created notifications
        """
        engineer_name = "Unknown"
        if service.assigned_to:
            engineer = db.query(models.User).filter(models.User.id == service.assigned_to).first()
            if engineer:
                engineer_name = engineer.full_name
        
        return NotificationService.notify_role_based(
            db=db,
            roles=[models.UserRole.ADMIN, models.UserRole.RECEPTION],
            title=f"⚠️ Negative Feedback - Service #{service.id}",
            message=f"Customer gave {feedback.rating}⭐ rating for service by {engineer_name}. Comment: {feedback.comment[:100] if feedback.comment else 'No comment'}",
            notification_type="negative_feedback",
            priority="high",
            module="service_engineer",
            action_url=f"/service-requests/{service.id}/feedback"
        )
    
    @staticmethod
    def notify_admin(
        db: Session,
        notification_type: NotificationType,
        title: str,
        message: str,
        params: Optional[dict] = None
    ):
        """
        Send notification to all admins with proper routing
        
        Args:
            db: Database session
            notification_type: Type from NotificationType enum
            title: Notification title
            message: Notification message
            params: URL parameters (e.g., {"id": "SR-123"})
        """
        admin_users = db.query(models.User).filter(
            models.User.role == models.UserRole.ADMIN,
            models.User.is_active == True
        ).all()
        
        action_url = NotificationRouter.get_action_url(notification_type, params)
        priority = NotificationRouter.get_priority(notification_type)
        icon = NotificationRouter.get_icon(notification_type)
        
        notifications_created = []
        for admin in admin_users:
            notification = NotificationService.create_notification(
                db=db,
                user_id=admin.id,
                title=f"{icon} {title}",
                message=message,
                notification_type=notification_type.value,
                priority=priority,
                module="admin",
                action_url=action_url
            )
            notifications_created.append(notification)
        
        logger.info(f"Sent {len(notifications_created)} admin notifications: {notification_type.value}")
        return notifications_created


# Helper functions for backward compatibility with existing code
def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    priority: str = "medium",
    module: str = None,
    action_url: str = None
) -> models.Notification:
    """Backward compatible wrapper for creating notifications"""
    return NotificationService.create_notification(
        db=db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        module=module,
        action_url=action_url
    )
