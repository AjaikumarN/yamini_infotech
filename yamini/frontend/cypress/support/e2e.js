// ***********************************************************
// Support file for E2E tests
// Loads all custom commands
// ***********************************************************

import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR errors from Cypress command log
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the error from failing the test
  return false;
});

// Set base URL from environment variable or default
Cypress.config('baseUrl', Cypress.env('BASE_URL') || 'http://localhost:5173');
