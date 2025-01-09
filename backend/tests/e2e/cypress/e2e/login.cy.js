describe('Login Page', () => {
  let hashedPassword;
  before(() => {
    cy.request('POST', `${Cypress.env('API_URL')}/api/test/clear`);
    cy.request('POST', `${Cypress.env('API_URL')}/api/test/seed`, {
      users: [
        {
          email: 'existinguser@example.com',
          password: 'testpassword',
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
  });

  describe('Page Load and Links', () => {
    it('should load the login page successfully', () => {
      cy.visit('/login');
      cy.contains('Log in to your account').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button').contains('Login').should('be.visible');
    });

    it('should navigate to the registration page when "Register" is clicked', () => {
      cy.visit('/login');
      cy.contains('Register').click();
      cy.url().should('include', '/register');
    });

    it('should navigate to the forgot password page when "Forgot Password?" is clicked', () => {
      cy.visit('/login');
      cy.contains('Forgot Password?').click();
      cy.url().should('include', '/forgot-password');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should show an error for empty fields', () => {
      cy.get('button').contains('Login').click();
      cy.contains('Please fill in all fields.').should('be.visible');
    });

    it('should show an error for invalid credentials', () => {
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('WrongPassword123');
      cy.get('button').contains('Login').click();
      cy.contains('Invalid email or password').should('be.visible');
    });
  });

  describe('Successful Login', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should log in successfully with valid credentials', () => {
      localStorage.clear();
      cy.get('input[name="email"]').type('existinguser@example.com');
      cy.get('input[name="password"]').type('testpassword');
      cy.get('button').contains('Login').click();
      cy.url().should('include', '/dashboard');
    });
  });
});
