// API y UI comparten solo operaciones reutilizables; las assertions viven en los tests.
Cypress.Commands.add('apiRequest', (method, path, options = {}) => {
  return cy.request({
    method,
    url: `${Cypress.expose('apiUrl')}${path}`,
    failOnStatusCode: false,
    retryOnNetworkFailure: false,
    // No mostramos cuerpos ni headers porque pueden contener password/token.
    log: false,
    ...options,
  });
});

Cypress.Commands.add('prepareSauceSession', () => {
  // Sauce Demo utiliza esta cookie para identificar al usuario autenticado.
  // Se prepara el estado directamente porque el login está fuera del alcance.
  // Este mecanismo es específico de esta aplicación de demostración.
  cy.visit('/');
  cy.setCookie('session-username', 'standard_user');
  cy.visit('/', {
  onBeforeLoad(win) {
    win.history.replaceState(null, '', '/inventory.html');
  },
});
  cy.location('pathname').should('eq', '/inventory.html');
  cy.get('[data-test="inventory-list"]').should('be.visible');
});
