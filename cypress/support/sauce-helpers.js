export const byTest = (name) => `[data-test="${name}"]`;

export function moneyToCents(text) {
  const match = text.trim().match(/^\$(\d+)\.(\d{2})$/);
  if (!match) throw new Error(`Formato monetario inesperado: ${text}`);
  // Se utilizan centavos enteros para evitar errores de decimales binarios.
  return Number(match[1]) * 100 + Number(match[2]);
}

export function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function assertItems(products) {
  cy.get(byTest('inventory-item')).should('have.length', products.length);
  products.forEach((product) => {
    cy.contains(byTest('inventory-item-name'), product.name)
      .should('have.text', product.name)
      .closest(byTest('inventory-item'))
      .within(() => {
        cy.get(byTest('inventory-item-price')).should('have.text', product.price);
        cy.get(byTest('item-quantity')).should('have.text', '1');
        cy.get(byTest('inventory-item-desc')).should('have.text', product.description);
      });
  });
}
