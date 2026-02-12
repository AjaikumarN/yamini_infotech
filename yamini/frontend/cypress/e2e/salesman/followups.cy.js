/**
 * Salesman Follow-Ups E2E Tests
 * Tests follow-up management and display
 */

describe('Salesman Follow-Ups', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/followups');
  });

  it('should load follow-ups page', () => {
    cy.get('.page-title').should('contain', 'Follow-Ups');
  });

  it('should show follow-ups or empty state', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.followup-card').length > 0) {
        cy.get('.followup-card').should('have.length.greaterThan', 0);
        cy.get('.followup-customer').should('exist');
        cy.get('.followup-phone').should('exist');
      } else {
        cy.get('.empty-state').should('be.visible');
        cy.get('.empty-state').should('contain', 'No pending follow-ups');
      }
    });
  });

  it('should display follow-up badges correctly', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.followup-card').length > 0) {
        cy.get('.followup-badge').should('exist');
      }
    });
  });

  it('should have "Call Now" action button', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.followup-card').length > 0) {
        cy.get('a[href^="tel:"]').should('exist');
        cy.get('.btn').contains('Call Now').should('be.visible');
      }
    });
  });

  it('should show last contact date', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.followup-card').length > 0) {
        cy.get('.followup-date').should('exist');
        cy.get('.followup-date').should('contain', 'Last contact');
      }
    });
  });

  it('should be mobile responsive', () => {
    cy.viewport('iphone-x');
    cy.get('.page-header').should('be.visible');
    cy.get('.card-grid').should('be.visible');
  });
});
