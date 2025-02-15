describe('Quota Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('test@example.com', 'password123');
    cy.visit('/quotas');
  });

  describe('Quota Limits', () => {
    it('creates a new token quota limit', () => {
      // Create new token quota
      cy.createQuotaLimit('TOKENS', 1000, 'DAILY');
      
      // Verify creation
      cy.shouldShowToast('Limite de quota criado com sucesso');
      cy.contains('1000 tokens/dia').should('be.visible');
    });

    it('creates a new request quota limit', () => {
      // Create new request quota
      cy.createQuotaLimit('REQUESTS', 5000, 'MONTHLY');
      
      // Verify creation
      cy.shouldShowToast('Limite de quota criado com sucesso');
      cy.contains('5000 requisições/mês').should('be.visible');
    });

    it('validates quota limit form', () => {
      cy.get('[data-testid="new-limit-button"]').click();
      
      // Try to submit without filling fields
      cy.get('button[type="submit"]').click();
      
      // Check validation messages
      cy.contains('O limite deve ser maior que zero').should('be.visible');
    });

    it('updates existing quota limit', () => {
      // Create quota first
      cy.createQuotaLimit('TOKENS', 1000, 'DAILY');
      
      // Edit quota
      cy.get('[data-testid="edit-limit-button"]').first().click();
      cy.get('input[name="limit"]').clear().type('2000');
      cy.get('button[type="submit"]').click();
      
      // Verify update
      cy.shouldShowToast('Limite de quota atualizado com sucesso');
      cy.contains('2000 tokens/dia').should('be.visible');
    });

    it('deletes quota limit', () => {
      // Create quota first
      cy.createQuotaLimit('TOKENS', 1000, 'DAILY');
      
      // Delete quota
      cy.get('[data-testid="delete-limit-button"]').first().click();
      cy.get('[data-testid="confirm-delete"]').click();
      
      // Verify deletion
      cy.shouldShowToast('Limite de quota excluído com sucesso');
      cy.contains('1000 tokens/dia').should('not.exist');
    });
  });

  describe('Quota Alerts', () => {
    beforeEach(() => {
      // Create a quota limit to use in alerts
      cy.createQuotaLimit('TOKENS', 1000, 'DAILY');
    });

    it('creates a new quota alert', () => {
      // Create new alert
      cy.createQuotaAlert('1', 80);
      
      // Verify creation
      cy.shouldShowToast('Alerta de quota criado com sucesso');
      cy.contains('80%').should('be.visible');
    });

    it('validates quota alert form', () => {
      cy.get('[data-testid="new-alert-button"]').click();
      
      // Try to submit without filling fields
      cy.get('button[type="submit"]').click();
      
      // Check validation messages
      cy.contains('Selecione uma quota').should('be.visible');
      cy.contains('O limite deve ser maior que 0').should('be.visible');
    });

    it('creates multiple alerts for same quota', () => {
      // Create alerts at different thresholds
      cy.createQuotaAlert('1', 50);
      cy.createQuotaAlert('1', 80);
      cy.createQuotaAlert('1', 90);
      
      // Verify all alerts exist
      cy.contains('50%').should('be.visible');
      cy.contains('80%').should('be.visible');
      cy.contains('90%').should('be.visible');
    });

    it('deletes quota alert', () => {
      // Create alert first
      cy.createQuotaAlert('1', 80);
      
      // Delete alert
      cy.get('[data-testid="delete-alert-button"]').first().click();
      cy.get('[data-testid="confirm-delete"]').click();
      
      // Verify deletion
      cy.shouldShowToast('Alerta de quota excluído com sucesso');
      cy.contains('80%').should('not.exist');
    });
  });

  describe('Quota Usage', () => {
    beforeEach(() => {
      cy.createQuotaLimit('TOKENS', 1000, 'DAILY');
    });

    it('displays quota usage chart', () => {
      cy.get('[data-testid="quota-usage-chart"]').should('be.visible');
    });

    it('allows changing time period', () => {
      cy.get('[data-testid="period-select"]').select('MONTHLY');
      cy.get('[data-testid="quota-usage-chart"]').should('be.visible');
    });

    it('shows usage alerts', () => {
      cy.createQuotaAlert('1', 50);
      // Assuming we have usage data that triggers the alert
      cy.contains('O uso atual atingiu 50% do limite estabelecido').should('be.visible');
    });
  });
});