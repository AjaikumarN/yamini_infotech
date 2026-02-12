/**
 * Admin Permissions Utilities
 * Defines what admin can/cannot do
 */

export const ADMIN_PERMISSIONS = {
  // Read permissions
  canViewSales: true,
  canViewService: true,
  canViewAttendance: true,
  canViewOrders: true,
  canViewAnalytics: true,
  canViewAuditLogs: true,
  canViewUsers: true,
  
  // Write permissions
  canAssignEnquiries: true,
  canApproveOrders: true,
  canCorrectAttendance: true,
  canAssignServiceRequests: true,
  canManageUsers: true,
  
  // Forbidden actions
  canMarkOwnAttendance: false,
  canSubmitDailyReports: false,
  canMakeCalls: false,
  canCreateSalesActivity: false,
  canCreateServiceActivity: false,
  canImpersonateStaff: false,
  canDeleteAuditLogs: false
};

/**
 * Check if action requires audit log
 */
export function requiresAudit(action) {
  const auditableActions = [
    'correctAttendance',
    'approveOrder',
    'rejectOrder',
    'assignEnquiry',
    'assignServiceRequest',
    'createUser',
    'updateUser',
    'deactivateUser'
  ];
  return auditableActions.includes(action);
}

/**
 * Get audit log entry structure
 */
export function createAuditLog(action, targetTable, targetId, reason = '') {
  return {
    action_type: action,
    target_table: targetTable,
    target_record_id: targetId,
    reason: reason,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate admin action before execution
 */
export function validateAdminAction(action) {
  const forbiddenActions = [
    'markAttendance',
    'submitDailyReport',
    'makeCall',
    'createOrder',
    'submitFeedback'
  ];
  
  if (forbiddenActions.includes(action)) {
    throw new Error(`Admin cannot perform ${action}. This action is reserved for staff.`);
  }
  
  return true;
}
