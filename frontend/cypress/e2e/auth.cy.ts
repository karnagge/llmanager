describe('Authentication', () => {
  beforeEach(() => {
    // Reset any previous state
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.login('test@example.com', 'password123');
    cy.shouldBeOnDashboard();
    cy.shouldShowToast('Login realizado com sucesso');
  });

  it('should show error with invalid credentials', () => {
    cy.login('invalid@example.com', 'wrongpassword');
    cy.url().should('include', '/login');
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Credenciais inválidas');
  });

  it('should redirect to requested page after login', () => {
    // Try to access protected page
    cy.visit('/quotas');
    cy.url().should('include', '/login');
    
    // Login
    cy.login('test@example.com', 'password123');
    
    // Should be redirected to original destination
    cy.url().should('include', '/quotas');
  });

  it('should protect routes from unauthorized access', () => {
    // Try to access various protected routes
    const protectedRoutes = [
      '/dashboard',
      '/quotas',
      '/metrics',
      '/settings'
    ];

    protectedRoutes.forEach(route => {
      cy.visit(route);
      cy.url().should('include', '/login');
    });
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('test@example.com', 'password123');
    cy.shouldBeOnDashboard();

    // Perform logout
    cy.logout();
    
    // Verify redirect to login page
    cy.url().should('include', '/login');
    cy.shouldShowToast('Logout realizado com sucesso');

    // Verify cannot access protected route
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should preserve form data after failed login', () => {
    const email = 'test@example.com';
    
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Email should still be in the input
    cy.get('input[type="email"]').should('have.value', email);
  });

  it('should show password validation errors', () => {
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('123'); // Too short
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="password-error"]')
      .should('be.visible')
      .and('contain', 'senha deve ter pelo menos 6 caracteres');
  });

  it('should show email validation errors', () => {
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="email-error"]')
      .should('be.visible')
      .and('contain', 'e-mail inválido');
  });
});