/**
 * Salesman Daily Report E2E Tests
 * Tests daily report submission
 */

describe('Salesman Daily Report', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/daily-report');
  });

  it('should load daily report page', () => {
    cy.get('.page-title').should('contain', 'Daily Report');
  });

  it('should show report form if not submitted', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form.form-card').length > 0) {
        cy.get('form.form-card').should('be.visible');
      }
    });
  });

  it('should have all report fields', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form.form-card').length > 0) {
        // Check for numeric input fields
        cy.get('input[type="number"]').should('have.length.greaterThan', 0);
        
        // Check for textarea (notes)
        cy.get('textarea').should('exist');
      }
    });
  });

  it('should submit daily report with valid data', () => {
    cy.get('body').then(($body) => {
      if ($body.find('form.form-card').length > 0) {
        // Fill report
        cy.get('input[type="number"]').each(($input, index) => {
          cy.wrap($input).clear().type(Math.floor(Math.random() * 10));
        });
        
        cy.get('textarea').type('Completed all assigned tasks today');
        
        // Submit
        cy.get('button[type="submit"]').click();
        cy.wait(2000);
      }
    });
  });

  it('should show already submitted message if report exists', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('already submitted') || $body.text().includes('Already Submitted')) {
        cy.get('.page-description, .alert, .banner').should('contain.text', 'submitted');
      }
    });
  });

  it('should be mobile responsive', () => {
    cy.viewport('iphone-x');
    cy.get('.page-header').should('be.visible');
  });
});
