/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';
import './commands';

// Extend Cypress types
declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>

      // Quota Management
      createQuotaAlert(quotaId: string, threshold: number): Chainable<void>
      createQuotaLimit(type: string, limit: number, period: string): Chainable<void>

      // Assertions
      shouldShowToast(message: string): Chainable<void>
      shouldBeOnDashboard(): Chainable<void>
    }
  }
}

// Handle uncaught exceptions from Next.js router
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('router')) {
    return false;
  }
  return true;
});

// Preserve session between tests
Cypress.Cookies.defaults({
  preserve: ['session', 'token', 'next-auth.session-token'],
});

// Configure reusable behaviors
beforeEach(() => {
  // Reset API state
  cy.intercept('POST', '/api/auth/login', (req) => {
    if (req.body.email === 'test@example.com' && req.body.password === 'password123') {
      req.reply({
        statusCode: 200,
        body: {
          token: 'fake-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      });
    } else {
      req.reply({
        statusCode: 401,
        body: { message: 'Invalid credentials' },
      });
    }
  });
});