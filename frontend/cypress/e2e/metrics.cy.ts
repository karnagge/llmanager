describe('Metrics & Grafana Integration', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/metrics');
  });

  describe('Grafana Dashboards', () => {
    it('loads main dashboard correctly', () => {
      cy.get('[data-testid="grafana-dashboard"]').should('exist');
      cy.get('[data-testid="grafana-loading"]').should('not.exist');
      cy.get('iframe').should('be.visible');
    });

    it('handles Grafana load error gracefully', () => {
      // Intercept Grafana request and simulate error
      cy.intercept('GET', '**/grafana/**', {
        statusCode: 500,
        body: 'Server Error'
      });

      cy.visit('/metrics');
      cy.get('[data-testid="grafana-error"]')
        .should('be.visible')
        .and('contain', 'Failed to load Grafana dashboard');
    });

    it('updates dashboard with time range selection', () => {
      cy.get('[data-testid="time-range-select"]').click();
      cy.get('[data-testid="time-range-option-24h"]').click();

      // Verify iframe URL contains correct time range
      cy.get('iframe').should('have.attr', 'src')
        .and('include', 'from=now-24h');
    });
  });

  describe('Grafana Panels', () => {
    it('loads individual panels correctly', () => {
      // Check request panel
      cy.get('[data-testid="requests-panel"]').within(() => {
        cy.get('iframe').should('be.visible');
        cy.get('[data-testid="grafana-loading"]').should('not.exist');
      });

      // Check tokens panel
      cy.get('[data-testid="tokens-panel"]').within(() => {
        cy.get('iframe').should('be.visible');
        cy.get('[data-testid="grafana-loading"]').should('not.exist');
      });
    });

    it('handles panel refresh correctly', () => {
      // Click refresh button
      cy.get('[data-testid="refresh-metrics"]').click();

      // Should show loading state
      cy.get('[data-testid="grafana-loading"]').should('exist');

      // Should complete loading
      cy.get('[data-testid="grafana-loading"]').should('not.exist');
      cy.get('iframe').should('be.visible');
    });

    it('allows panel resizing', () => {
      const panel = '[data-testid="requests-panel"]';
      
      // Get initial height
      cy.get(panel).then($el => {
        const initialHeight = $el.height();

        // Click expand button
        cy.get(`${panel} [data-testid="expand-panel"]`).click();

        // Verify height increased
        cy.get(panel).should($expandedEl => {
          expect($expandedEl.height()).to.be.greaterThan(initialHeight);
        });
      });
    });
  });

  describe('Metrics Settings', () => {
    it('configures Grafana URL', () => {
      cy.visit('/settings/metrics');

      const newUrl = 'https://grafana.example.com';
      cy.get('[data-testid="grafana-url-input"]').clear().type(newUrl);
      cy.get('[data-testid="save-settings"]').click();

      // Verify success message
      cy.shouldShowToast('Configurações salvas com sucesso');

      // Verify new URL is being used
      cy.visit('/metrics');
      cy.get('iframe').should('have.attr', 'src')
        .and('include', newUrl);
    });

    it('validates Grafana URL', () => {
      cy.visit('/settings/metrics');

      // Try invalid URL
      cy.get('[data-testid="grafana-url-input"]').clear().type('invalid-url');
      cy.get('[data-testid="save-settings"]').click();

      cy.get('[data-testid="grafana-url-error"]')
        .should('be.visible')
        .and('contain', 'URL inválida');
    });

    it('tests Grafana connection', () => {
      cy.visit('/settings/metrics');

      cy.get('[data-testid="test-connection"]').click();

      // Should show success message
      cy.shouldShowToast('Conexão com Grafana estabelecida com sucesso');
    });
  });

  describe('Auto Refresh', () => {
    it('automatically refreshes metrics on interval', () => {
      // Enable auto refresh
      cy.get('[data-testid="auto-refresh-toggle"]').click();
      
      // Wait for first refresh
      cy.get('[data-testid="last-refresh"]').invoke('text').as('firstRefresh');
      
      // Wait for auto refresh interval
      cy.wait(60000); // 1 minute

      // Check if refresh time updated
      cy.get('[data-testid="last-refresh"]').invoke('text').then((newRefresh) => {
        cy.get('@firstRefresh').then((oldRefresh) => {
          expect(newRefresh).not.to.eq(oldRefresh);
        });
      });
    });

    it('persists auto refresh setting', () => {
      // Enable auto refresh
      cy.get('[data-testid="auto-refresh-toggle"]').click();
      
      // Reload page
      cy.reload();

      // Verify setting persisted
      cy.get('[data-testid="auto-refresh-toggle"]').should('be.checked');
    });
  });
});