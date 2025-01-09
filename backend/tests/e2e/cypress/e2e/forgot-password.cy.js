describe('Forgot Password Page', () => {
  beforeEach(() => {
    cy.visit('/forgot-password');
  });

  it('should load the forgot password page successfully', () => {
    cy.contains('Forgot Password').should('be.visible');
    cy.contains('Enter your email address to receive a password reset link.').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('button').contains('Send Reset Link').should('be.visible');
  });

  it('should show an error for empty email', () => {
    cy.get('button').contains('Send Reset Link').click();
    cy.contains('Email is required.').should('be.visible');
  });

  it('should show a success message for valid email submission', () => {
    cy.intercept('POST', `${Cypress.env('API_URL')}/api/auth/request-password-reset`, {
      statusCode: 200,
      body: {
        message: 'If the email exists, a password reset link has been sent.',
      },
    }).as('requestPasswordReset');

    cy.get('input[name="email"]').type('user@example.com');
    cy.get('button').contains('Send Reset Link').click();
    cy.wait('@requestPasswordReset');

    cy.contains('If the email exists, a password reset link has been sent.').should('be.visible');
  });

  it('should show an error message for server failure', () => {
    cy.intercept('POST', `${Cypress.env('API_URL')}/api/auth/request-password-reset`, {
      statusCode: 500,
      body: {
        message: 'Failed to send password reset request.',
      },
    }).as('requestPasswordResetError');

    cy.get('input[name="email"]').type('user@example.com');
    cy.get('button').contains('Send Reset Link').click();
    cy.wait('@requestPasswordResetError');

    cy.contains('Failed to send password reset request.').should('be.visible');
  });
});
