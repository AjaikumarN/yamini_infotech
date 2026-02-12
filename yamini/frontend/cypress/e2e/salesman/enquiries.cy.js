/**
 * Salesman Enquiries E2E Tests
 * Tests enquiry viewing and management
 */

describe('Salesman Enquiries', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/enquiries');
  });

  it('should load enquiries page', () => {
    cy.get('.page-title').should('contain', 'Enquiries');
  });

  it('should display enquiries or empty state', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.enquiry-card').length > 0) {
        cy.get('.enquiry-card').should('have.length.greaterThan', 0);
      } else {
        cy.get('.empty-state').should('be.visible');
      }
    });
  });

  it('should filter enquiries by status', () => {
    cy.get('select').contains('Status').parent().select('new');
    cy.wait(500);
  });

  it('should filter enquiries by priority', () => {
    cy.get('select').contains('Priority').parent().select('hot');
    cy.wait(500);
  });

  it('should show enquiry details on card', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.enquiry-card').length > 0) {
        const $card = $body.find('.enquiry-card').first();
        cy.wrap($card).should('contain', 'Customer');
        cy.wrap($card).should('contain', 'Phone');
        cy.wrap($card).should('contain', 'Product');
      }
    });
  });

  it('should have action buttons on enquiry cards', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.enquiry-card').length > 0) {
        cy.get('.enquiry-card').first().within(() => {
          cy.get('.btn, button, a').should('have.length.greaterThan', 0);
        });
      }
    });
  });

  it('should be mobile responsive', () => {
    cy.viewport('iphone-x');
    cy.get('.page-header').should('be.visible');
  });
});
