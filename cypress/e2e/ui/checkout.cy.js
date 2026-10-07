import { byTest, moneyToCents, formatMoney, assertItems } from '../../support/sauce-helpers';

describe('Compra completa en Sauce Demo', () => {
  beforeEach(() => {
    cy.prepareSauceSession();
    cy.fixture('checkout').as('buyer');
  });

  it('compra tres productos y confirma la orden con standard_user', () => {
    const selected = [];

    // Capturamos nombres/precios/descripciones del catálogo para compararlos
    // con el carrito; no repetimos valores fijos que podrían quedar desactualizados.
    cy.get(byTest('inventory-item')).should('have.length.at.least', 3)
      .then(($items) => {
        [...$items].slice(0, 3).forEach((item) => {
          const $item = Cypress.$(item);
          const addButton = $item.find('button[data-test^="add-to-cart-"]');
          expect(addButton.length, 'botón de agregar').to.eq(1);
          selected.push({
            name: $item.find(byTest('inventory-item-name')).text(),
            price: $item.find(byTest('inventory-item-price')).text(),
            description: $item.find(byTest('inventory-item-desc')).text(),
            addTest: addButton.attr('data-test'),
          });
        });
        selected.forEach((product) => {
          expect(product.name).to.be.a('string').and.not.be.empty;
          expect(moneyToCents(product.price)).to.be.greaterThan(0);
          cy.get(byTest(product.addTest)).click();
        });
      });

    cy.get(byTest('shopping-cart-badge')).should('have.text', '3');
    cy.get(byTest('shopping-cart-link')).click();
    cy.location('pathname').should('eq', '/cart.html');
    cy.get(byTest('title')).should('have.text', 'Your Cart');
    cy.then(() => assertItems(selected));
    cy.get(byTest('checkout')).should('be.enabled').click();

    cy.location('pathname').should('eq', '/checkout-step-one.html');
    cy.get('@buyer').then((buyer) => {
      cy.get(byTest('firstName')).type(buyer.firstName).should('have.value', buyer.firstName);
      cy.get(byTest('lastName')).type(buyer.lastName).should('have.value', buyer.lastName);
      cy.get(byTest('postalCode')).type(buyer.postalCode).should('have.value', buyer.postalCode);
    });
    cy.get(byTest('continue')).click();

    cy.location('pathname').should('eq', '/checkout-step-two.html');
    cy.get(byTest('title')).should('have.text', 'Checkout: Overview');
    cy.then(() => {
      assertItems(selected);
      const subtotal = selected.reduce((sum, product) => sum + moneyToCents(product.price), 0);
      cy.get(byTest('subtotal-label')).should('have.text', `Item total: ${formatMoney(subtotal)}`);
      cy.get(byTest('tax-label')).invoke('text').then((text) => {
        const tax = moneyToCents(text.replace('Tax: ', ''));
        expect(tax, 'impuesto no negativo').to.be.at.least(0);
        cy.get(byTest('total-label')).should('have.text', `Total: ${formatMoney(subtotal + tax)}`);
      });
    });
    cy.get(byTest('payment-info-value')).should('be.visible').and('not.be.empty');
    cy.get(byTest('shipping-info-value')).should('be.visible').and('not.be.empty');
    cy.get(byTest('finish')).click();

    cy.location('pathname').should('eq', '/checkout-complete.html');
    cy.get(byTest('complete-header')).should('be.visible').and('have.text', 'Thank you for your order!');
    cy.get(byTest('complete-text')).should('contain.text', 'Your order has been dispatched');
    cy.get(byTest('shopping-cart-badge')).should('not.exist');
  });
});
