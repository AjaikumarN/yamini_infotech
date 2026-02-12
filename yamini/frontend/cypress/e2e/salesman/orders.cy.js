/**
 * Salesman Orders E2E Tests
 * Tests order viewing and creation
 */

describe('Salesman Orders', () => {
  beforeEach(() => {
    cy.loginAsSalesman();
    cy.visit('/salesman/orders');
  });

  it('should load orders page', () => {
    cy.get('.page-title').should('contain', 'Orders');
  });

  it('should display orders or empty state', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.order-card').length > 0) {
        cy.get('.order-card').should('have.length.greaterThan', 0);
      } else {
        cy.get('.empty-state').should('be.visible');
      }
    });
  });

  it('should have "Create Order" button', () => {
    cy.get('.btn').contains('Create Order').should('be.visible');
  });

  it('should be mobile responsive', () => {
    cy.viewport('iphone-x');
    cy.get('.page-header').should('be.visible');
  });
});
