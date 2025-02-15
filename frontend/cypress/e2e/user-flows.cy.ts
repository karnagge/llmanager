describe('Complete User Flows', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('completes full quota management flow', () => {
    // Login
    cy.login('test@example.com', 'password123');
    cy.shouldBeOnDashboard();

    // Create quota limit
    cy.createQuotaLimit('TOKENS', 1000, 'DAILY');
    cy.shouldShowToast('Limite de quota criado com sucesso');

    // Create quota alert
    cy.createQuotaAlert('1', 80);
    cy.shouldShowToast('Alerta de quota criado com sucesso');

    // View metrics
    cy.visit('/metrics');
    cy.get('[data-testid="grafana-dashboard"]').should('exist');
    cy.get('iframe').should('be.visible');

    // Check quota usage
    cy.get('[data-testid="quota-usage-chart"]').should('exist');
    cy.get('[data-testid="usage-percentage"]').should('exist');

    // View and manage alerts
    cy.visit('/quotas/alerts');
    cy.contains('80%').should('be.visible');

    // Update quota limit
    cy.visit('/quotas/limits');
    cy.get('[data-testid="edit-limit-button"]').first().click();
    cy.get('input[name="limit"]').clear().type('2000');
    cy.get('button[type="submit"]').click();
    cy.shouldShowToast('Limite de quota atualizado com sucesso');

    // Verify changes in dashboard
    cy.visit('/dashboard');
    cy.get('[data-testid="quota-status"]').should('contain', '2000');
  });

  it('completes settings configuration flow', () => {
    // Login
    cy.login('test@example.com', 'password123');
    
    // Configure Grafana settings
    cy.visit('/settings/metrics');
    cy.get('[data-testid="grafana-url-input"]')
      .clear()
      .type('https://grafana.example.com');
    cy.get('[data-testid="save-settings"]').click();
    cy.shouldShowToast('Configurações salvas com sucesso');

    // Enable auto refresh
    cy.visit('/metrics');
    cy.get('[data-testid="auto-refresh-toggle"]').click();
    
    // Verify auto refresh status persists
    cy.reload();
    cy.get('[data-testid="auto-refresh-toggle"]').should('be.checked');

    // Configure alert preferences
    cy.visit('/settings/notifications');
    cy.get('[data-testid="email-notifications"]').check();
    cy.get('[data-testid="notification-threshold"]').clear().type('90');
    cy.get('[data-testid="save-notifications"]').click();
    cy.shouldShowToast('Preferências de notificação salvas');
  });

  it('handles error scenarios gracefully', () => {
    // Login with invalid credentials
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');

    // Login with valid credentials
    cy.login('test@example.com', 'password123');

    // Try to create invalid quota
    cy.visit('/quotas/limits');
    cy.get('[data-testid="new-limit-button"]').click();
    cy.get('input[name="limit"]').type('-100');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="limit-error"]').should('be.visible');

    // Try to access invalid Grafana dashboard
    cy.visit('/metrics');
    cy.intercept('GET', '**/grafana/**', {
      statusCode: 500,
      body: 'Server Error'
    });
    cy.reload();
    cy.get('[data-testid="grafana-error"]').should('be.visible');

    // Recover from errors
    cy.visit('/quotas/limits');
    cy.createQuotaLimit('TOKENS', 1000, 'DAILY');
    cy.shouldShowToast('Limite de quota criado com sucesso');
  });

  it('verifies data consistency across views', () => {
    cy.login('test@example.com', 'password123');

    // Create quota and alert
    cy.createQuotaLimit('TOKENS', 5000, 'MONTHLY');
    cy.createQuotaAlert('1', 75);

    // Check dashboard view
    cy.visit('/dashboard');
    cy.get('[data-testid="quota-status"]').should('contain', '5000');
    cy.get('[data-testid="quota-alerts"]').should('contain', '75%');

    // Check metrics view
    cy.visit('/metrics');
    cy.get('[data-testid="usage-limit"]').should('contain', '5000');

    // Check alerts view
    cy.visit('/quotas/alerts');
    cy.contains('75%').should('be.visible');

    // Check settings view
    cy.visit('/settings/quotas');
    cy.get('[data-testid="quota-list"]').should('contain', '5000');
  });
});