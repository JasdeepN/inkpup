describe('Contact Form', () => {
  it('submits successfully', () => {
    cy.visit('/contact');
    cy.get('[data-testid="contact-name"]').type('Test User');
    cy.get('[data-testid="contact-email"]').type('test@example.com');
    cy.get('[data-testid="contact-message"]').type('Hello from Cypress');
    cy.get('form').submit();
    cy.contains('Thank you').should('be.visible');
  });
});
