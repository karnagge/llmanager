/// <reference types="cypress" />

declare namespace Cypress {
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

// Add custom command types
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