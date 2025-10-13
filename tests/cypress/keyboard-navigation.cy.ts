describe('Keyboard Navigation', () => {
  it('skip link moves focus to main content', () => {
    cy.visit('/');
    cy.get('[data-testid="skip-link"]').should('be.visible').focus().type('{enter}');
    cy.get('#content').should('be.visible').and('have.focus');
  });
});
