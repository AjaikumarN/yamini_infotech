/**
 * Smart Workflow Automation Service
 * Automates manual tasks, reduces paperwork
 */
import { API_BASE_URL } from '../config';

class WorkflowService {
  constructor() {
    this.rules = [];
    this.initialized = false;
    this.onRuleTriggered = null; // Callback for UI updates
  }

  async initialize() {
    if (this.initialized) return;
    await this.loadRules();
    this.initialized = true;
  }

  /**
   * Get all configured workflow rules
   */
  getRules() {
    return this.rules.map(r => ({
      id: r.id,
      name: r.name,
      description: this.getRuleDescription(r.id),
      trigger: { type: this.getTriggerType(r.trigger), time: this.getTriggerTime(r.id) },
      action: r.action,
      enabled: r.enabled
    }));
  }

  getRuleDescription(id) {
    const descriptions = {
      'auto_followup_reminder': 'Sends reminder notifications for follow-ups due today',
      'auto_escalate_sla': 'Automatically escalates to manager when SLA breach is imminent',
      'auto_assign_nearby': 'Suggests nearby engineers for new service requests',
      'auto_daily_report': 'Auto-generates daily activity report at end of day',
      'auto_attendance_reminder': 'Reminds employees to mark attendance at 9 AM',
      'auto_checkout_reminder': 'Reminds to check out from visits at 6 PM'
    };
    return descriptions[id] || 'Automated workflow rule';
  }

  getTriggerType(trigger) {
    if (trigger === 'time_based') return 'time';
    if (trigger === 'sla_breach') return 'event';
    if (trigger === 'new_service_request') return 'event';
    return 'condition';
  }

  getTriggerTime(id) {
    const times = {
      'auto_attendance_reminder': '09:00',
      'auto_checkout_reminder': '18:00',
      'auto_daily_report': '18:30'
    };
    return times[id] || null;
  }

  async loadRules() {
    // Default workflow rules
    this.rules = [
      {
        id: 'auto_followup_reminder',
        name: 'Auto Follow-up Reminder',
        trigger: 'time_based',
        condition: 'followup_due_today',
        action: 'send_notification',
        enabled: true
      },
      {
        id: 'auto_escalate_sla',
        name: 'Auto Escalate SLA Breach',
        trigger: 'sla_breach',
        condition: 'sla_remaining_hours < 1',
        action: 'escalate_to_manager',
        enabled: true
      },
      {
        id: 'auto_assign_nearby',
        name: 'Auto Assign Nearby Task',
        trigger: 'new_service_request',
        condition: 'engineer_within_5km',
        action: 'suggest_assignment',
        enabled: true
      },
      {
        id: 'auto_daily_report',
        name: 'Auto Generate Daily Report',
        trigger: 'time_based',
        condition: 'time == 18:30',
        action: 'generate_daily_report',
        enabled: true
      },
      {
        id: 'auto_attendance_reminder',
        name: 'Auto Attendance Reminder',
        trigger: 'time_based',
        condition: 'time == 09:00 && !attendance_marked',
        action: 'send_attendance_reminder',
        enabled: true
      },
      {
        id: 'auto_checkout_reminder',
        name: 'Auto Check-out Reminder',
        trigger: 'time_based',
        condition: 'time == 18:00 && visit_active',
        action: 'send_checkout_reminder',
        enabled: true
      }
    ];
  }

  /**
   * Execute workflow based on trigger
   */
  async executeWorkflow(trigger, context = {}) {
    const applicableRules = this.rules.filter(r => r.trigger === trigger && r.enabled);
    
    for (const rule of applicableRules) {
      const conditionMet = await this.evaluateCondition(rule.condition, context);
      if (conditionMet) {
        await this.executeAction(rule.action, context);
      }
    }
  }

  async evaluateCondition(condition, context) {
    switch (condition) {
      case 'followup_due_today':
        return this.checkFollowupsDueToday(context);
      case 'sla_remaining_hours < 1':
        return context.sla_remaining_hours < 1;
      case 'engineer_within_5km':
        return await this.checkNearbyEngineers(context);
      default:
        return false;
    }
  }

  async executeAction(action, context) {
    switch (action) {
      case 'send_notification':
        await this.sendNotification(context);
        break;
      case 'escalate_to_manager':
        await this.escalateToManager(context);
        break;
      case 'suggest_assignment':
        await this.suggestAssignment(context);
        break;
      case 'generate_daily_report':
        await this.triggerDailyReport(context);
        break;
      case 'send_attendance_reminder':
        await this.sendAttendanceReminder(context);
        break;
      case 'send_checkout_reminder':
        await this.sendCheckoutReminder(context);
        break;
    }
  }

  async checkFollowupsDueToday(context) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/enquiries?followup_due=today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.length > 0;
    } catch (e) {
      return false;
    }
  }

  async checkNearbyEngineers(context) {
    // Check if there are engineers within 5km of the service location
    return true; // Simplified - always suggest
  }

  async sendNotification(context) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: context.notification_title || 'Workflow Notification',
          message: context.notification_message || 'You have pending tasks',
          type: 'workflow',
          priority: 'medium'
        })
      });
    } catch (e) {
      console.warn('Failed to send notification:', e);
    }
  }

  async escalateToManager(context) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/workflows/escalate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'sla_breach',
          ticket_id: context.ticket_id,
          message: `SLA breach imminent for ticket ${context.ticket_no}`
        })
      });
    } catch (e) {
      console.warn('Failed to escalate:', e);
    }
  }

  async suggestAssignment(context) {
    // This would be handled by the backend
    console.log('Suggesting assignment for nearby engineers');
  }

  async triggerDailyReport(context) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/workflows/trigger-daily-report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.warn('Failed to trigger daily report:', e);
    }
  }

  async sendAttendanceReminder(context) {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Attendance Reminder', {
        body: 'Please mark your attendance for today',
        icon: '/favicon.ico'
      });
    }
  }

  async sendCheckoutReminder(context) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Check-out Reminder', {
        body: 'Remember to check out from your current visit',
        icon: '/favicon.ico'
      });
    }
  }

  /**
   * Check and execute time-based workflows
   */
  async checkTimeBasedWorkflows() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // 9:00 AM - Attendance reminder
    if (timeStr === '09:00') {
      await this.executeWorkflow('time_based', { 
        condition: 'attendance_reminder',
        notification_title: '📍 Mark Attendance',
        notification_message: 'Please mark your attendance for today'
      });
    }

    // 6:00 PM - Checkout reminder
    if (timeStr === '18:00') {
      await this.executeWorkflow('time_based', {
        condition: 'checkout_reminder',
        notification_title: '🏠 End of Day',
        notification_message: 'Remember to check out from your visit'
      });
    }

    // 6:30 PM - Daily report
    if (timeStr === '18:30') {
      await this.executeWorkflow('time_based', {
        condition: 'daily_report'
      });
    }
  }

  /**
   * Start periodic workflow checks
   */
  startPeriodicChecks() {
    // Check every minute
    setInterval(() => {
      this.checkTimeBasedWorkflows();
    }, 60000);
  }
}

const workflowService = new WorkflowService();
export default workflowService;
