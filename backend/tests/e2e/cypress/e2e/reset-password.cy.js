describe('Reset Password Page', () => {
  const apiUrl = Cypress.env('API_URL');

  beforeEach(() => {
    cy.intercept('POST', `${apiUrl}/api/auth/validate-reset-token`, (req) => {
      const validToken = 'valid-token';
      if (req.body.token === validToken) {
        req.reply(200);
      } else {
        req.reply(400, { message: 'Invalid or expired token.' });
      }
    }).as('validateToken');

    cy.intercept('POST', `${apiUrl}/api/auth/reset-password`, (req) => {
      if (req.body.token === 'valid-token') {
        req.reply(200, { message: 'Password reset successfully!' });
      } else {
        req.reply(400, { message: 'Failed to reset password. Please try again.' });
      }
    }).as('resetPassword');
  });

  describe('Token Validation', () => {
    it('should show a loading spinner during token validation', () => {
      cy.visit('/reset-password?token=valid-token');
      cy.contains('Validating token...').should('be.visible');
      cy.wait('@validateToken');
    });

    it('should show an error for an invalid or missing token', () => {
      cy.visit('/reset-password?token=invalid-token');
      cy.wait('@validateToken');
      cy.contains('Invalid or expired token.').should('be.visible');
      cy.contains('Go to Login').should('be.visible').click();
      cy.url().should('include', '/login');
    });

    it('should proceed to the form if the token is valid', () => {
      cy.visit('/reset-password?token=valid-token');
      cy.wait('@validateToken');
      cy.contains('Reset Your Password').should('be.visible');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      cy.visit('/reset-password?token=valid-token');
      cy.wait('@validateToken');
    });

    it('should show an error if fields are empty', () => {
      cy.get('button').contains('Reset Password').click();
      cy.contains('Both password fields are required.').should('be.visible');
    });

    it('should show an error for weak passwords', () => {
      cy.get('input[name="password"]').type('12');
      cy.get('input[name="confirmPassword"]').type('12');
      cy.get('button').contains('Reset Password').click();
      cy.contains('Password must be at least').should('be.visible');
    });

    it('should show an error if passwords do not match', () => {
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Mismatch123!');
      cy.get('button').contains('Reset Password').click();
      cy.contains('Passwords do not match.').should('be.visible');
    });

    it('should show a success message for a valid password reset', () => {
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="confirmPassword"]').type('Password123!');
      cy.get('button').contains('Reset Password').click();
      cy.wait('@resetPassword');
      cy.contains('Password reset successfully! Redirecting to login...').should('be.visible');
      cy.url().should('include', '/login', { timeout: 5000 });
    });

    it('should show an error if the reset password request fails', () => {
      cy.visit('/reset-password?token=invalid-token');
      cy.contains('Validating token...').should('be.visible');
      cy.wait('@validateToken');
      cy.contains('Invalid or expired token.').should('be.visible');
      cy.get('button').contains('Go to Login').click();
      cy.url().should('include', '/login');
    });
    
  });
});
