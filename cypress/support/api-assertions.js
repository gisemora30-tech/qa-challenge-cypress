export function expectHttp(response, status) {
  expect(response.status, 'código HTTP').to.eq(status);
}

export function expectJson(response) {
  expect(response.headers['content-type'], 'Content-Type').to.include('application/json');
}

export function expectPositiveInteger(value, label) {
  expect(value, label).to.be.a('number');
  expect(Number.isInteger(value), `${label}: entero`).to.eq(true);
  expect(value, label).to.be.greaterThan(0);
}

export function expectProduct(product) {
  expect(product).to.be.an('object');
  expect(product).to.include.all.keys('id', 'title', 'price', 'description', 'category', 'image');
  expectPositiveInteger(product.id, 'product.id');
  ['title', 'description', 'category', 'image'].forEach((key) => {
    expect(product[key], `product.${key}`).to.be.a('string').and.not.be.empty;
  });
  expect(product.price, 'product.price').to.be.a('number').and.be.at.least(0);
  expect(Number.isFinite(product.price), 'precio finito').to.eq(true);
}

export function expectCart(cart) {
  expect(cart).to.be.an('object');
  expect(cart).to.include.all.keys('id', 'userId', 'date', 'products');
  expectPositiveInteger(cart.id, 'cart.id');
  expectPositiveInteger(cart.userId, 'cart.userId');
  expect(cart.date, 'cart.date').to.be.a('string');
  expect(Number.isNaN(Date.parse(cart.date)), 'fecha válida').to.eq(false);
  expect(cart.products, 'cart.products').to.be.an('array').and.not.be.empty;
  cart.products.forEach((product) => {
    expect(product).to.be.an('object').and.include.all.keys('productId', 'quantity');
    expectPositiveInteger(product.productId, 'productId');
    expectPositiveInteger(product.quantity, 'quantity');
  });
}

export function expectCartMatches(cart, payload) {
  expectCart(cart);
  expect(cart.userId, 'usuario del carrito').to.eq(payload.userId);
  // La API puede normalizar la fecha a ISO completo; comparamos el día.
  expect(cart.date.slice(0, 10), 'día del carrito').to.eq(payload.date);
  expect(cart.products, 'productos y cantidades enviados').to.deep.eq(payload.products);
}
