describe('Registration Page', () => {
  it('should load the registration page successfully', () => {
    cy.visit('/register');
    cy.contains('Enter your details').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="nickname"]').should('be.visible');
    cy.get('button').contains('Register').should('be.visible');
  });
});

describe('Registration Page - Error Handling and Submission', () => {
  beforeEach(() => {
    cy.request('POST', `${Cypress.env('API_URL')}/api/test/clear`);
    cy.request('POST', `${Cypress.env('API_URL')}/api/test/seed`, {
      users: [
        {
          email: 'existinguser@example.com',
          password: 'hashedpassword123',
          nickname: 'validnickname',
          email_confirmed: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      policies: [
        {
          type: 'terms',
          version: 1,
          content: 'Terms content',
          effective_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          type: 'privacy',
          version: 1,
          content: 'Privacy content',
          effective_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });
    cy.visit('/register');
  });

  it('should show error when nickname is empty', () => {
    cy.get('button').contains('Register').click();
    cy.contains('Nickname cannot be empty or just spaces').should('be.visible');
  });

  it('should show error for invalid nickname format after correcting empty nickname', () => {
    cy.get('button').contains('Register').click();
    cy.get('input[name="nickname"]').type('a');
    cy.get('button').contains('Register').click();
    cy.contains('Nickname should be 3-15 characters long and contain only letters, numbers, underscores, or dashes.').should('be.visible');
  });

  it('should show error for duplicate nickname after correcting invalid nickname', () => {
    cy.get('input[name="nickname"]').type('validnickname');
    cy.intercept('POST', `${Cypress.env('API_URL')}/api/auth/check-nickname`).as('checkNickname');
    cy.wait('@checkNickname');
    cy.get('button').contains('Register').click();
    cy.contains('This nickname is already taken.').should('be.visible');
  });

  it('should show error for not accepting terms and privacy after correcting nickname', () => {
    cy.get('input[name="nickname"]').type('uniquenickname');
    cy.intercept('POST', `${Cypress.env('API_URL')}/api/auth/check-nickname`).as('checkNickname');
    cy.wait('@checkNickname');
    cy.get('button').contains('Register').click();
    cy.contains('You must agree to the Terms and Privacy Policy').should('be.visible');
  });

  it('should show error for mismatched passwords after accepting terms and privacy', () => {
    cy.get('input[name="nickname"]').type('uniquenickname');
    cy.intercept('POST', `${Cypress.env('API_URL')}/api/auth/check-nickname`).as('checkNickname');
    cy.wait('@checkNickname');
    cy.get('input[name="termsAccepted"]').check();
    cy.get('input[name="privacyAccepted"]').check();
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Mismatch123!');
    cy.get('button').contains('Register').click();
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should show error for weak password after correcting mismatched passwords', () => {
    cy.get('input[name="nickname"]').type('uniquenickname');
    cy.intercept('POST', `${Cypress.env('API_URL')}/api/auth/check-nickname`).as('checkNickname');
    cy.wait('@checkNickname');
    cy.get('input[name="termsAccepted"]').check();
    cy.get('input[name="privacyAccepted"]').check();
    cy.get('input[name="password"]').type('12');
    cy.get('input[name="confirmPassword"]').type('12');
    cy.get('button').contains('Register').click();
    cy.contains('Password must be at least').should('be.visible');
  });

  it('should register successfully after correcting all errors', () => {
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="nickname"]').type('uniquenickname');
    cy.intercept('POST', `${Cypress.env('API_URL')}/api/auth/check-nickname`).as('checkNickname');
    cy.wait('@checkNickname');
  
    cy.get('input[name="termsAccepted"]').check();
    cy.get('input[name="privacyAccepted"]').check();
  
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
  
    cy.get('button').contains('Register').click();
  
    cy.url().should('include', '/login');
    cy.contains('Registration successful! Please check your email to confirm your account.').should('be.visible');
  });
  
});
