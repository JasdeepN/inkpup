describe('Mobile Menu', () => {
  it('opens and focuses first link, closes on Escape', () => {
    cy.visit('/');
    cy.get('[data-testid="nav-toggle"]').click();
    cy.get('nav[aria-label="Mobile"]').should('be.visible');
    cy.get('nav[aria-label="Mobile"] [data-testid^="mobile-"]').first().should('be.visible').focus();
    cy.get('body').type('{esc}');
    cy.get('nav[aria-label="Mobile"]').should('not.be.visible');
  });
});
