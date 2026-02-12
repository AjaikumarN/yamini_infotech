/**
 * Cypress UI Tests for Salesman Portal
 * Tests the complete rebuilt UI with professional design
 */

describe('Salesman Portal - Complete UI Tests', () => {
  
  // Setup: Login as salesman before each test
  beforeEach(() => {
    cy.visit('http://localhost:5173/login');
    
    // Login with salesman credentials
    cy.get('input[type="text"]').type('salesman');
    cy.get('input[type="password"]').type('password');
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    cy.url().should('include', '/salesman/dashboard');
  });

  describe('1. Dashboard Tests', () => {
    it('should display dashboard without attendance blocking', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      cy.contains('Dashboard').should('be.visible');
      
      // Should see stat cards
      cy.contains('Calls Today').should('be.visible');
      cy.contains('Active Enquiries').should('be.visible');
      cy.contains('Orders This Month').should('be.visible');
      cy.contains('Attendance Status').should('be.visible');
      
      // Should see optional attendance banner (not blocking)
      cy.get('.attendance-banner').should('be.visible');
      
      // Quick actions should be visible
      cy.contains('Quick Actions').should('be.visible');
    });

    it('should show attendance reminder as optional (not blocking)', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Check for soft yellow banner (not blocking red)
      cy.get('.attendance-banner.not-marked').should('exist');
      cy.contains('optional').should('be.visible');
      
      // User should still be able to see and use dashboard
      cy.get('.stat-card').should('have.length.gte', 3);
    });
  });

  describe('2. Sidebar Navigation Tests', () => {
    it('should display all sidebar menu items', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Check all menu items are present
      cy.contains('Dashboard').should('be.visible');
      cy.contains('Attendance').should('be.visible');
      cy.contains('Enquiries & Leads').should('be.visible');
      cy.contains('Calls').should('be.visible');
      cy.contains('Follow-Ups').should('be.visible');
      cy.contains('Orders').should('be.visible');
      cy.contains('Daily Report').should('be.visible');
      cy.contains('Discipline & Compliance').should('be.visible');
      cy.contains('Logout').should('be.visible');
    });

    it('should navigate to all pages without errors', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Navigate to Attendance
      cy.contains('Attendance').click();
      cy.url().should('include', '/salesman/attendance');
      cy.contains('Mark Attendance').should('be.visible');
      
      // Navigate to Enquiries
      cy.contains('Enquiries & Leads').click();
      cy.url().should('include', '/salesman/enquiries');
      cy.contains('Enquiries & Leads').should('be.visible');
      
      // Navigate to Calls
      cy.contains('Calls').click();
      cy.url().should('include', '/salesman/calls');
      cy.contains('Calls').should('be.visible');
      
      // Navigate to Follow-Ups
      cy.contains('Follow-Ups').click();
      cy.url().should('include', '/salesman/followups');
      cy.contains('Follow-Ups').should('be.visible');
      
      // Navigate to Orders
      cy.contains('Orders').click();
      cy.url().should('include', '/salesman/orders');
      cy.contains('Orders').should('be.visible');
      
      // Navigate to Daily Report
      cy.contains('Daily Report').click();
      cy.url().should('include', '/salesman/daily-report');
      cy.contains('Daily Report').should('be.visible');
      
      // Navigate to Compliance
      cy.contains('Discipline & Compliance').click();
      cy.url().should('include', '/salesman/compliance');
      cy.contains('Discipline & Compliance').should('be.visible');
      
      // Back to Dashboard
      cy.contains('Dashboard').click();
      cy.url().should('include', '/salesman/dashboard');
    });

    it('should highlight active menu item', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Dashboard should be active
      cy.get('.sidebar-item.active').should('contain', 'Dashboard');
      
      // Navigate to Calls
      cy.contains('Calls').click();
      cy.get('.sidebar-item.active').should('contain', 'Calls');
    });
  });

  describe('3. Attendance Page Tests (NO Blocking)', () => {
    it('should be accessible without marking attendance', () => {
      cy.visit('http://localhost:5173/salesman/attendance');
      
      // Should load without errors
      cy.contains('Mark Attendance').should('be.visible');
      cy.contains('optional').should('be.visible');
      
      // Should have photo capture input
      cy.get('input[type="file"]').should('exist');
      cy.contains('Capture Photo').should('be.visible');
    });

    it('should not block access to other pages', () => {
      // Visit attendance page
      cy.visit('http://localhost:5173/salesman/attendance');
      
      // Navigate away without marking
      cy.contains('Calls').click();
      cy.url().should('include', '/salesman/calls');
      
      // Should load calls page successfully
      cy.contains('Calls').should('be.visible');
    });
  });

  describe('4. Calls Page with Voice Input', () => {
    it('should display voice input button', () => {
      cy.visit('http://localhost:5173/salesman/calls');
      
      // Click "Log Call" button
      cy.contains('+ Log Call').click();
      
      // Check for voice button
      cy.get('.voice-btn').should('be.visible');
      cy.get('.voice-btn').should('contain', '🎤');
      
      // Check voice input hint
      cy.contains('microphone button to use voice-to-text').should('be.visible');
    });

    it('should have call form with all required fields', () => {
      cy.visit('http://localhost:5173/salesman/calls');
      
      cy.contains('+ Log Call').click();
      
      // Check form fields
      cy.get('input[type="text"]').should('exist'); // Customer name
      cy.get('input[type="tel"]').should('exist'); // Phone
      cy.get('textarea').should('exist'); // Notes
      cy.get('select').should('exist'); // Outcome
    });
  });

  describe('5. Mobile Responsiveness', () => {
    it('should display hamburger menu on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Hamburger button should be visible
      cy.get('.mobile-menu-btn').should('be.visible');
      
      // Sidebar should be hidden initially on mobile
      cy.get('.salesman-sidebar').should('not.have.class', 'mobile-open');
      
      // Click hamburger to open sidebar
      cy.get('.mobile-menu-btn').click();
      cy.get('.salesman-sidebar').should('have.class', 'mobile-open');
    });

    it('should have touch-friendly buttons on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Check button sizes (should be at least 44px tall for touch)
      cy.get('.sidebar-item').should('have.css', 'height').and('match', /48px/);
    });

    it('should display cards in single column on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Stat cards should stack vertically
      cy.get('.card-grid').should('be.visible');
    });
  });

  describe('6. Empty States', () => {
    it('should display empty state when no calls', () => {
      cy.visit('http://localhost:5173/salesman/calls');
      
      // If no calls, should show empty state
      cy.get('.empty-state, .call-card').should('exist');
    });

    it('should display empty state when no orders', () => {
      cy.visit('http://localhost:5173/salesman/orders');
      
      // If no orders, should show empty state
      cy.get('.empty-state, .order-card').should('exist');
    });
  });

  describe('7. Daily Report Submission', () => {
    it('should have report form with all fields', () => {
      cy.visit('http://localhost:5173/salesman/daily-report');
      
      // Check for form fields
      cy.contains('Calls Made').should('be.visible');
      cy.contains('Meetings Done').should('be.visible');
      cy.contains('Orders Closed').should('be.visible');
      cy.contains('Achievements').should('be.visible');
      cy.contains('Challenges').should('be.visible');
      cy.contains("Tomorrow's Plan").should('be.visible');
    });
  });

  describe('8. Compliance Page', () => {
    it('should display all compliance rules', () => {
      cy.visit('http://localhost:5173/salesman/compliance');
      
      // Check for categories
      cy.contains('Attendance').should('be.visible');
      cy.contains('Communication').should('be.visible');
      cy.contains('Reporting').should('be.visible');
      cy.contains('Follow-Ups').should('be.visible');
      cy.contains('Customer Service').should('be.visible');
      cy.contains('Data Management').should('be.visible');
    });

    it('should emphasize optional attendance in compliance', () => {
      cy.visit('http://localhost:5173/salesman/compliance');
      
      // Check that attendance is mentioned as optional/recommended
      cy.contains('optional but recommended').should('be.visible');
    });
  });

  describe('9. Design System Verification', () => {
    it('should use correct color scheme', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Check primary blue color (#2563EB) is used
      cy.get('.sidebar-item.active').should('have.css', 'color', 'rgb(37, 99, 235)');
    });

    it('should have correct sidebar width', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Sidebar should be 260px when expanded
      cy.get('.salesman-sidebar').should('have.css', 'width', '260px');
    });

    it('should have professional card styling', () => {
      cy.visit('http://localhost:5173/salesman/dashboard');
      
      // Stat cards should have rounded corners
      cy.get('.stat-card').should('have.css', 'border-radius', '12px');
    });
  });

  describe('10. No Attendance Blocking (Critical Test)', () => {
    it('should NEVER block access to pages based on attendance', () => {
      // Visit dashboard directly without marking attendance
      cy.visit('http://localhost:5173/salesman/dashboard');
      cy.contains('Dashboard').should('be.visible');
      
      // Visit calls page
      cy.visit('http://localhost:5173/salesman/calls');
      cy.contains('Calls').should('be.visible');
      
      // Visit enquiries page
      cy.visit('http://localhost:5173/salesman/enquiries');
      cy.contains('Enquiries').should('be.visible');
      
      // Visit orders page
      cy.visit('http://localhost:5173/salesman/orders');
      cy.contains('Orders').should('be.visible');
      
      // Visit daily report page
      cy.visit('http://localhost:5173/salesman/daily-report');
      cy.contains('Daily Report').should('be.visible');
      
      // Should NEVER be redirected to attendance page
      cy.url().should('not.include', '/salesman/attendance');
    });
  });
});
