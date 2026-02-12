// ***********************************************
// Custom commands for Salesman Portal E2E Testing
// ***********************************************

/**
 * Login as Salesman
 * Usage: cy.loginAsSalesman()
 */
Cypress.Commands.add('loginAsSalesman', () => {
  cy.visit('/login');
  
  // Enter salesman credentials
  cy.get('input[name="username"]').type('salesman_test');
  cy.get('input[name="password"]').type('Test@123');
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/salesman/dashboard');
  
  // Verify token is stored
  cy.window().its('localStorage.yamini_user').should('exist');
});

/**
 * Login as Admin (for testing admin access)
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');
  cy.get('input[name="username"]').type('admin');
  cy.get('input[name="password"]').type('Admin@123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin');
});

/**
 * Navigate to salesman page
 * Usage: cy.goToSalesmanPage('calls')
 */
Cypress.Commands.add('goToSalesmanPage', (page) => {
  cy.visit(`/salesman/${page}`);
  cy.wait(500); // Wait for page load
});

/**
 * Mock geolocation
 */
Cypress.Commands.add('mockGeolocation', (latitude = 13.0827, longitude = 80.2707) => {
  cy.window().then((win) => {
    cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
      success({
        coords: {
          latitude,
          longitude,
          accuracy: 10
        },
        timestamp: Date.now()
      });
    });
  });
});

/**
 * Upload file
 */
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'image/png') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('fake image content'),
    fileName: fileName,
    mimeType: fileType
  }, { force: true });
});

/**
 * Check if toast notification appears
 */
Cypress.Commands.add('shouldShowToast', (message) => {
  cy.get('.toast-notification').should('contain', message);
});
