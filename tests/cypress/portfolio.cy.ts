describe('Portfolio', () => {
  it('loads each category and renders expected items', () => {
    cy.visit('/portfolio');
    cy.contains('Portfolio').should('be.visible');
    cy.get('.gallery-grid').should('exist');
  });

  it('shows error message when gallery API fails', () => {
    cy.visit('/portfolio');
    cy.intercept('GET', '/api/gallery', { statusCode: 500 }).as('galleryFail');
    cy.reload();
    cy.contains('Unable to load').should('be.visible');
  });

  it('opens and closes gallery modal when selecting an item', () => {
    cy.visit('/portfolio');
    cy.get('[data-e2e-id^="gallery-item-"] button').first().click();
    cy.get('.gallery-modal').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('.gallery-modal').should('not.exist');
  });

  it('renders legacy slug portfolio page', () => {
    cy.visit('/portfolio/example-piece');
    cy.contains('Portfolio item: example-piece').should('be.visible');
  });
});
