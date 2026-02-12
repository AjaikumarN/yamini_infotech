/**
 * Salesman Calls E2E Tests
 * Tests call logging, voice-to-text, and filtering
 */

describe('Salesman Calls', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/calls');
  });

  it('should load calls page successfully', () => {
    cy.get('.page-title').should('contain', 'Calls');
  });

  it('should show "Log Call" button', () => {
    cy.get('.btn-primary').contains('Log Call').should('be.visible');
  });

  it('should toggle call form on button click', () => {
    // Click to open form
    cy.get('.btn').contains('Log Call').click();
    cy.get('form.form-card').should('be.visible');
    
    // Click to close form
    cy.get('.btn').contains('Cancel').click();
    cy.get('form.form-card').should('not.exist');
  });

  it('should display call form fields', () => {
    cy.get('.btn').contains('Log Call').click();
    
    // Check form fields
    cy.get('input[type="text"]').should('exist'); // Customer name
    cy.get('input[type="tel"]').should('exist');  // Phone
    cy.get('textarea').should('exist');           // Notes
    cy.get('select').should('exist');             // Outcome
  });

  it('should show voice input button and language selector', () => {
    cy.get('.btn').contains('Log Call').click();
    
    // Check voice language selector
    cy.get('select').contains('English').should('exist');
    cy.get('select option[value="ta-IN"]').should('exist'); // Tamil option
    
    // Check voice input button
    cy.get('.btn').contains('Voice Input').should('be.visible');
  });

  it('should submit call with valid data', () => {
    cy.get('.btn').contains('Log Call').click();
    
    // Fill form
    cy.get('input[type="text"]').first().type('Test Customer');
    cy.get('input[type="tel"]').type('9876543210');
    cy.get('textarea').type('Discussed product features and pricing');
    cy.get('select').last().select('interested');
    
    // Submit
    cy.get('button[type="submit"]').click();
    
    // Wait for API response
    cy.wait(2000);
    
    // Form should close (or show success message)
  });

  it('should require all mandatory fields', () => {
    cy.get('.btn').contains('Log Call').click();
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click();
    
    // HTML5 validation should prevent submission
    cy.get('input:invalid').should('have.length.greaterThan', 0);
  });

  it('should filter calls by time period', () => {
    // Select "Today" filter
    cy.get('select').first().select('today');
    cy.wait(1000);
    
    // Select "This Week" filter
    cy.get('select').first().select('week');
    cy.wait(1000);
    
    // Select "All Calls" filter
    cy.get('select').first().select('all');
    cy.wait(1000);
  });

  it('should display calls in card grid', () => {
    // Check if calls exist (might be empty state)
    cy.get('body').then(($body) => {
      if ($body.find('.call-card').length > 0) {
        cy.get('.call-card').first().should('be.visible');
        cy.get('.call-customer').should('exist');
        cy.get('.call-phone').should('exist');
      } else {
        cy.get('.empty-state').should('be.visible');
      }
    });
  });

  it('should be mobile responsive', () => {
    cy.viewport('iphone-x');
    
    cy.get('.page-header').should('be.visible');
    cy.get('.btn').contains('Log Call').should('be.visible');
    
    // Open form on mobile
    cy.get('.btn').contains('Log Call').click();
    cy.get('form.form-card').should('be.visible');
  });

  it('should export calls data', () => {
    // Check for export buttons
    cy.get('.export-buttons').should('exist');
  });
});
