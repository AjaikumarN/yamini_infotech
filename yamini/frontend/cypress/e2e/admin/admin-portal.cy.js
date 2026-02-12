/**
 * Admin Portal E2E Tests
 * Tests admin-specific actions: orders, invoices, approvals
 */

describe('Admin Portal - Orders Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin');
  });

  it('should display orders page with stats', () => {
    cy.visit('/admin/orders');
    cy.contains('Orders - Admin Management').should('be.visible');
    cy.contains('Total Orders').should('be.visible');
    cy.contains('Pending Approval').should('be.visible');
  });

  it('should allow admin to approve pending order', () => {
    cy.visit('/admin/orders');
    
    // Filter to pending orders
    cy.contains('button', 'pending').click();
    
    // Check if approve button exists and is enabled
    cy.get('button').contains('Approve').should('exist');
    cy.get('button').contains('Approve').should('not.be.disabled');
  });

  it('should allow admin to reject order with reason', () => {
    cy.visit('/admin/orders');
    
    // Filter to pending orders
    cy.contains('button', 'pending').click();
    
    // Check if reject button exists
    cy.get('button').contains('Reject').should('exist');
    cy.get('button').contains('Reject').should('not.be.disabled');
  });

  it('should filter orders by status', () => {
    cy.visit('/admin/orders');
    
    // Test all filters
    ['all', 'pending', 'approved', 'rejected'].forEach(filter => {
      cy.contains('button', filter).click();
      cy.contains('button', filter).should('have.css', 'border', '2px solid rgb(59, 130, 246)');
    });
  });

  it('should display create order button for admin', () => {
    cy.visit('/admin/orders');
    cy.contains('button', 'Create Order').should('be.visible');
    cy.contains('button', 'Create Order').should('not.be.disabled');
  });
});

describe('Admin Portal - Invoices Management', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should display invoices page with stats', () => {
    cy.visit('/admin/invoices');
    cy.contains('Billing & Invoices').should('be.visible');
    cy.contains('Total Invoices').should('be.visible');
    cy.contains('Total Amount').should('be.visible');
  });

  it('should allow admin to create invoice', () => {
    cy.visit('/admin/invoices');
    cy.contains('button', 'Create Invoice').should('be.visible');
    cy.contains('button', 'Create Invoice').should('not.be.disabled');
  });

  it('should open create invoice modal', () => {
    cy.visit('/admin/invoices');
    cy.contains('button', 'Create Invoice').click();
    cy.contains('Create New Invoice').should('be.visible');
    cy.get('input[type="text"]').should('exist');
    cy.get('input[type="email"]').should('exist');
  });

  it('should validate required fields in invoice form', () => {
    cy.visit('/admin/invoices');
    cy.contains('button', 'Create Invoice').click();
    
    // Try to submit without filling
    cy.contains('button', 'Create Invoice').last().click();
    
    // Should see validation or alert
    cy.get('input[type="text"]').should('have.attr', 'required');
    cy.get('input[type="email"]').should('have.attr', 'required');
  });

  it('should allow admin to export invoice', () => {
    cy.visit('/admin/invoices');
    
    // Check if export button exists
    cy.get('button').contains('Export').should('exist');
  });

  it('should allow admin to mark invoice as paid', () => {
    cy.visit('/admin/invoices');
    
    // Filter to pending
    cy.contains('button', 'pending').click();
    
    // Check for mark paid button
    cy.get('button').contains('Mark Paid').should('exist');
  });
});

describe('Admin Portal - Attendance Management', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should display attendance page with stats', () => {
    cy.visit('/admin/attendance');
    cy.contains('Attendance Management').should('be.visible');
    cy.contains('Total Staff').should('be.visible');
  });

  it('should allow admin to correct attendance', () => {
    cy.visit('/admin/attendance');
    
    // Check if correct button exists
    cy.get('button').contains('Correct').should('exist');
  });

  it('should display attendance stats', () => {
    cy.visit('/admin/attendance');
    cy.contains('On Time').should('be.visible');
    cy.contains('Late').should('be.visible');
    cy.contains('Absent').should('be.visible');
  });
});

describe('Admin Portal - Analytics Dashboard', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should display analytics page', () => {
    cy.visit('/admin/analytics');
    cy.contains('Analytics Dashboard').should('be.visible');
  });

  it('should load analytics data', () => {
    cy.visit('/admin/analytics');
    cy.contains('Loading').should('not.exist');
  });
});

describe('Admin Portal - Audit Logs', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('should display audit logs page', () => {
    cy.visit('/admin/audit-logs');
    cy.contains('Audit Logs').should('be.visible');
  });

  it('should have filter options', () => {
    cy.visit('/admin/audit-logs');
    cy.get('select').should('exist');
  });

  it('should not allow deleting audit logs', () => {
    cy.visit('/admin/audit-logs');
    cy.get('button').contains('Delete').should('not.exist');
  });
});

describe('Admin Portal - Permission Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
  });

  it('admin should NOT see staff-specific actions', () => {
    cy.visit('/admin/orders');
    
    // Admin should NOT see buttons like "Create Call", "Add Visit"
    cy.contains('Create Call').should('not.exist');
    cy.contains('Add Visit').should('not.exist');
    cy.contains('Submit Daily Report').should('not.exist');
  });

  it('admin should see controlled write actions', () => {
    cy.visit('/admin/orders');
    
    // Admin SHOULD see these actions
    cy.contains('Create Order').should('exist');
    cy.get('button').contains('Approve').should('exist');
  });

  it('admin should NOT be able to delete orders', () => {
    cy.visit('/admin/orders');
    
    // Delete button should not exist
    cy.get('button').contains('Delete').should('not.exist');
  });

  it('admin should NOT be able to delete invoices', () => {
    cy.visit('/admin/invoices');
    
    // Delete button should not exist
    cy.get('button').contains('Delete').should('not.exist');
  });
});
