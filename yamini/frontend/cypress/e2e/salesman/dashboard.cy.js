/**
 * Salesman Dashboard E2E Tests
 * Tests dashboard loading, stats display, and quick actions
 */

describe('Salesman Dashboard', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/dashboard');
  });

  it('should load dashboard successfully', () => {
    cy.get('.page-title').should('contain', 'Dashboard');
    cy.get('.page-description').should('be.visible');
  });

  it('should display summary stats cards', () => {
    // Check for stat cards
    cy.get('[data-testid="stat-card-calls"]').should('exist');
    cy.get('[data-testid="stat-card-enquiries"]').should('exist');
    cy.get('[data-testid="stat-card-orders"]').should('exist');
    cy.get('[data-testid="stat-card-attendance"]').should('exist');
    
    // Verify cards have icons and values
    cy.get('.stat-card').should('have.length.greaterThan', 0);
  });

  it('should show optional attendance reminder if not marked', () => {
    // If attendance not marked, should show yellow banner
    cy.get('.attendance-banner').then(($banner) => {
      if ($banner.hasClass('not-marked')) {
        cy.get('.attendance-banner').should('contain', 'Attendance Not Marked');
      }
    });
  });

  it('should display quick action buttons', () => {
    cy.get('.action-card').should('have.length.greaterThan', 0);
    
    // Verify quick action links
    cy.get('a[href="/salesman/calls"]').should('exist');
    cy.get('a[href="/salesman/enquiries"]').should('exist');
    cy.get('a[href="/salesman/daily-report"]').should('exist');
  });

  it('should navigate to calls page from quick action', () => {
    cy.get('a[href="/salesman/calls"]').click();
    cy.url().should('include', '/salesman/calls');
    cy.get('.page-title').should('contain', 'Calls');
  });

  it('should toggle analytics view', () => {
    cy.get('.btn').contains('Show Analytics').click();
    cy.get('.advanced-analytics').should('be.visible');
    
    cy.get('.btn').contains('Hide Analytics').click();
    cy.get('.advanced-analytics').should('not.exist');
  });

  it('should refresh dashboard data', () => {
    cy.get('.btn-refresh').should('exist');
    // Dashboard should be responsive
    cy.viewport('iphone-x');
    cy.get('.page-header').should('be.visible');
  });
});
