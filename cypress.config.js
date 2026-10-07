const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.saucedemo.com',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
  },
  // URLs públicas en expose; las credenciales se leen solamente con cy.env().
  expose: { apiUrl: 'https://fakestoreapi.com' },
  viewportWidth: 1280,
  viewportHeight: 800,
  defaultCommandTimeout: 10000,
  requestTimeout: 20000,
  responseTimeout: 30000,
  video: false,
  screenshotOnRunFailure: true,
  // No se repiten escrituras automáticamente: podrían duplicar datos en una API real.
  retries: 0,
});
