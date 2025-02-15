import '@testing-library/cypress/add-commands';

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
});

Cypress.Commands.add('createQuotaAlert', (quotaId: string, threshold: number) => {
  cy.visit('/quotas/alerts');
  cy.get('[data-testid="new-alert-button"]').click();
  cy.get('select[name="quotaId"]').select(quotaId);
  cy.get('input[name="threshold"]').type(threshold.toString());
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('createQuotaLimit', (type: string, limit: number, period: string) => {
  cy.visit('/quotas/limits');
  cy.get('[data-testid="new-limit-button"]').click();
  cy.get('select[name="type"]').select(type);
  cy.get('input[name="limit"]').type(limit.toString());
  cy.get('select[name="period"]').select(period);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('shouldShowToast', (message: string) => {
  cy.get('[data-testid="toast"]').should('contain', message);
});

Cypress.Commands.add('shouldBeOnDashboard', () => {
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="dashboard-title"]').should('exist');
});

// Configure Cypress behavior
Cypress.on('uncaught:exception', (err) => {
  // Prevent failures on Next.js router errors
  if (err.message.includes('router')) {
    return false;
  }
  return true;
});

// For TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      createQuotaAlert(quotaId: string, threshold: number): Chainable<void>
      createQuotaLimit(type: string, limit: number, period: string): Chainable<void>
      shouldShowToast(message: string): Chainable<void>
      shouldBeOnDashboard(): Chainable<void>
    }
  }
}