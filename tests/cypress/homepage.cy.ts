describe('Homepage', () => {
  it('loads and displays header', () => {
    cy.visit('/');
    cy.get('header').should('be.visible');
    cy.contains('Portfolio').should('be.visible');
  });
}
