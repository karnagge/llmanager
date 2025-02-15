/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

interface Window {
  Cypress: Cypress.Cypress;
}

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

    // DOM Interactions from Testing Library
    findByText(text: string | RegExp): Chainable<JQuery<HTMLElement>>
    findByRole(role: string, options?: any): Chainable<JQuery<HTMLElement>>
    findByTestId(testId: string): Chainable<JQuery<HTMLElement>>
  }

  // Extend Cypress.cy interface
  interface cy {
    state(key: string): any
    state(key: string, value: any): void
  }

  // Extend Cypress interface
  interface Cypress {
    env(key: string): string
    env(object: { [key: string]: any }): void
    env(key: string, value: any): void
  }
}

// Declare global variables used in tests
declare const expect: Chai.ExpectStatic
declare const assert: Chai.AssertStatic
declare const cy: Cypress.cy & CyEventEmitter
declare namespace cy {
  const state: typeof Cypress.cy.state
}