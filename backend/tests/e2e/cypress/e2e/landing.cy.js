describe('Landing Page', () => {
  it('should load successfully', () => {
    cy.visit('/');
    cy.contains('Harness Word-of-Mouth').should('be.visible');
    cy.get('button').contains('See How It Works').should('be.visible');
  });
});
