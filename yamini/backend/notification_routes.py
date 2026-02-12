"""
Admin Notification Routing Configuration
Maps notification types to specific admin dashboard routes with filters
Every notification MUST redirect to an actionable page with proper context
"""

from enum import Enum
from typing import Optional, Dict


class NotificationType(str, Enum):
    """All admin notification types with predefined routes"""
    
    # ENQUIRIES & SALES
    ENQUIRY_NEW = "ENQUIRY_NEW"
    ENQUIRY_HOT = "ENQUIRY_HOT"
    ENQUIRY_CONVERTED = "ENQUIRY_CONVERTED"
    ENQUIRY_FOLLOWUP_MISSED = "ENQUIRY_FOLLOWUP_MISSED"
    
    # SERVICE & SLA
    SERVICE_NEW = "SERVICE_NEW"
    SERVICE_EMERGENCY = "SERVICE_EMERGENCY"
    SERVICE_ASSIGNED = "SERVICE_ASSIGNED"
    SERVICE_SLA_RISK = "SERVICE_SLA_RISK"
    SERVICE_SLA_BREACHED = "SERVICE_SLA_BREACHED"
    SERVICE_COMPLETED = "SERVICE_COMPLETED"
    
    # ORDERS & BILLING
    ORDER_PENDING = "ORDER_PENDING"
    ORDER_APPROVED = "ORDER_APPROVED"
    INVOICE_CREATED = "INVOICE_CREATED"
    OUTSTANDING_ALERT = "OUTSTANDING_ALERT"
    
    # EMPLOYEES & PRODUCTIVITY
    ENGINEER_INACTIVE = "ENGINEER_INACTIVE"
    SALESMAN_INACTIVE = "SALESMAN_INACTIVE"
    ATTENDANCE_MISSING = "ATTENDANCE_MISSING"
    LATE_ATTENDANCE = "LATE_ATTENDANCE"
    
    # SYSTEM & RISK
    REPEAT_COMPLAINTS = "REPEAT_COMPLAINTS"
    STOCK_CRITICAL = "STOCK_CRITICAL"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class NotificationRouter:
    """Generate action URLs for admin notifications"""
    
    # Route map: notification type -> URL template
    ROUTES = {
        # Enquiries & Sales
        NotificationType.ENQUIRY_NEW: "/admin/enquiries?filter=new",
        NotificationType.ENQUIRY_HOT: "/admin/enquiries?priority=HOT",
        NotificationType.ENQUIRY_CONVERTED: "/admin/enquiries/{id}",
        NotificationType.ENQUIRY_FOLLOWUP_MISSED: "/admin/sales-performance?salesman={salesman_id}",
        
        # Service & SLA
        NotificationType.SERVICE_NEW: "/admin/service/requests?filter=NEW",
        NotificationType.SERVICE_EMERGENCY: "/admin/service/requests?priority=emergency",
        NotificationType.SERVICE_ASSIGNED: "/admin/service/requests/{id}",
        NotificationType.SERVICE_SLA_RISK: "/admin/service/requests?filter=sla_risk",
        NotificationType.SERVICE_SLA_BREACHED: "/admin/service/sla-monitor",
        NotificationType.SERVICE_COMPLETED: "/admin/service/requests/{id}?tab=report",
        
        # Orders & Billing
        NotificationType.ORDER_PENDING: "/admin/orders?status=PENDING",
        NotificationType.ORDER_APPROVED: "/admin/orders/{id}",
        NotificationType.INVOICE_CREATED: "/admin/invoices/{id}",
        NotificationType.OUTSTANDING_ALERT: "/admin/finance/outstanding",
        
        # Employees & Productivity
        NotificationType.ENGINEER_INACTIVE: "/admin/employees/service-engineers",
        NotificationType.SALESMAN_INACTIVE: "/admin/sales-performance",
        NotificationType.ATTENDANCE_MISSING: "/admin/attendance?missing=true",
        NotificationType.LATE_ATTENDANCE: "/admin/attendance?status=late",
        
        # System & Risk
        NotificationType.REPEAT_COMPLAINTS: "/admin/service/analytics?metric=repeat",
        NotificationType.STOCK_CRITICAL: "/admin/inventory/stock?filter=low",
        NotificationType.SYSTEM_ERROR: "/admin/system/audit-logs",
    }
    
    # Priority mapping
    PRIORITY_MAP = {
        NotificationType.ENQUIRY_NEW: "medium",
        NotificationType.ENQUIRY_HOT: "critical",
        NotificationType.ENQUIRY_CONVERTED: "low",
        NotificationType.ENQUIRY_FOLLOWUP_MISSED: "high",
        
        NotificationType.SERVICE_NEW: "medium",
        NotificationType.SERVICE_EMERGENCY: "critical",
        NotificationType.SERVICE_ASSIGNED: "low",
        NotificationType.SERVICE_SLA_RISK: "high",
        NotificationType.SERVICE_SLA_BREACHED: "critical",
        NotificationType.SERVICE_COMPLETED: "low",
        
        NotificationType.ORDER_PENDING: "medium",
        NotificationType.ORDER_APPROVED: "low",
        NotificationType.INVOICE_CREATED: "low",
        NotificationType.OUTSTANDING_ALERT: "high",
        
        NotificationType.ENGINEER_INACTIVE: "high",
        NotificationType.SALESMAN_INACTIVE: "medium",
        NotificationType.ATTENDANCE_MISSING: "medium",
        NotificationType.LATE_ATTENDANCE: "medium",
        
        NotificationType.REPEAT_COMPLAINTS: "high",
        NotificationType.STOCK_CRITICAL: "critical",
        NotificationType.SYSTEM_ERROR: "critical",
    }
    
    # Icon mapping for frontend
    ICON_MAP = {
        NotificationType.ENQUIRY_NEW: "📩",
        NotificationType.ENQUIRY_HOT: "🔥",
        NotificationType.ENQUIRY_CONVERTED: "✅",
        NotificationType.ENQUIRY_FOLLOWUP_MISSED: "⚠️",
        
        NotificationType.SERVICE_NEW: "🔧",
        NotificationType.SERVICE_EMERGENCY: "🚨",
        NotificationType.SERVICE_ASSIGNED: "👷",
        NotificationType.SERVICE_SLA_RISK: "⏱",
        NotificationType.SERVICE_SLA_BREACHED: "❌",
        NotificationType.SERVICE_COMPLETED: "✅",
        
        NotificationType.ORDER_PENDING: "🧾",
        NotificationType.ORDER_APPROVED: "✅",
        NotificationType.INVOICE_CREATED: "📄",
        NotificationType.OUTSTANDING_ALERT: "💰",
        
        NotificationType.ENGINEER_INACTIVE: "⚠️",
        NotificationType.SALESMAN_INACTIVE: "📉",
        NotificationType.ATTENDANCE_MISSING: "⏱",
        NotificationType.LATE_ATTENDANCE: "⏰",
        
        NotificationType.REPEAT_COMPLAINTS: "🔁",
        NotificationType.STOCK_CRITICAL: "📦",
        NotificationType.SYSTEM_ERROR: "🚨",
    }
    
    @classmethod
    def get_action_url(
        cls,
        notification_type: NotificationType,
        params: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Generate action URL for a notification type
        
        Args:
            notification_type: Type of notification
            params: Parameters to fill in URL template (e.g., {"id": "ENQ-123"})
        
        Returns:
            Complete action URL with parameters filled
        """
        url_template = cls.ROUTES.get(notification_type, "/admin")
        
        if params:
            try:
                url = url_template.format(**params)
            except KeyError:
                # Missing parameter, return base template
                url = url_template
        else:
            url = url_template
        
        return url
    
    @classmethod
    def get_priority(cls, notification_type: NotificationType) -> str:
        """Get priority level for notification type"""
        return cls.PRIORITY_MAP.get(notification_type, "medium")
    
    @classmethod
    def get_icon(cls, notification_type: NotificationType) -> str:
        """Get icon emoji for notification type"""
        return cls.ICON_MAP.get(notification_type, "📌")
