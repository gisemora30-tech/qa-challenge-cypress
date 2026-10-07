import {
  expectHttp,
  expectJson,
  expectPositiveInteger,
  expectProduct,
  expectCart,
  expectCartMatches,
} from '../../support/api-assertions';

function readCredentials() {
  return cy.env(['apiUsername', 'apiPassword', 'apiUserId']).then((credentials) => {
    // Validamos presencia sin mostrar credenciales en los errores.
    if (!credentials.apiUsername || !credentials.apiPassword) {
      throw new Error('Configurá apiUsername y apiPassword en cypress.env.json. Ver README.');
    }

    expectPositiveInteger(credentials.apiUserId, 'apiUserId configurado');
    return credentials;
  });
}

function login(credentials) {
  return cy.apiRequest('POST', '/auth/login', {
    body: {
      username: credentials.apiUsername,
      password: credentials.apiPassword,
    },
  }).then((response) => {
    // El login válido responde HTTP 201.
    expectHttp(response, 201);
    expectJson(response);

    // Validamos el token sin imprimir su valor.
    expect(
      response.body !== null && typeof response.body === 'object',
      'objeto de login',
    ).to.eq(true);

    expect(typeof response.body.token === 'string', 'token de tipo string').to.eq(true);
    expect(response.body.token.length > 0, 'token no vacío').to.eq(true);

    return response.body.token;
  });
}

describe('Fake Store API', () => {
  it('obtiene un token con credenciales válidas', () => {
    readCredentials().then((credentials) => login(credentials));
  });

  it('rechaza un login con contraseña incorrecta', () => {
    readCredentials().then((credentials) => {
      // Generamos una contraseña incorrecta durante la ejecución.
      const invalidPassword = `${credentials.apiPassword}-invalid-${Date.now()}`;

      cy.apiRequest('POST', '/auth/login', {
        body: {
          username: credentials.apiUsername,
          password: invalidPassword,
        },
      }).then((response) => {
        expectHttp(response, 401);

        // Esta API devuelve el error como texto.
        expect(response.headers['content-type'], 'Content-Type del error').to.be.a('string');
        expect(response.body, 'mensaje de credenciales inválidas').to.be.a('string');
        expect(response.body.toLowerCase()).to.include('username or password is incorrect');
      });
    });
  });

  it('crea, actualiza y solicita eliminar el mismo carrito con productos dinámicos', () => {
    // Todo el flujo ocurre en un escenario, sin depender de otros tests.
    let token;
    let headers;
    let cartId;
    let payload;
    let additionalProduct;

    readCredentials().then((credentials) => {
      return login(credentials).then((generatedToken) => {
        // Guardamos el token en memoria y lo reutilizamos en las solicitudes.
        token = generatedToken;
        headers = { Authorization: `Bearer ${token}` };

        payload = {
          userId: credentials.apiUserId,
          date: new Date().toISOString().slice(0, 10),
          products: [],
        };
      });
    });

    cy.then(() => cy.apiRequest('GET', '/products', { headers })).then((response) => {
      expectHttp(response, 200);
      expectJson(response);
      expect(response.body).to.be.an('array').and.have.length.at.least(4);

      response.body.forEach(expectProduct);

      const ids = response.body.map((product) => product.id);
      expect(new Set(ids).size, 'IDs únicos del catálogo').to.eq(ids.length);

      // Seleccionamos productos existentes a partir de la respuesta de la API.
      const products = [...response.body].sort((a, b) => a.id - b.id);

      payload.products = products.slice(0, 3).map((product) => ({
        productId: product.id,
        quantity: 1,
      }));

      additionalProduct = {
        productId: products[3].id,
        quantity: 2,
      };
    });

    cy.then(() => cy.apiRequest('POST', '/carts', {
      headers,
      body: payload,
    })).then((response) => {
      // La creación del carrito responde HTTP 201.
      expectHttp(response, 201);
      expectJson(response);
      expectCartMatches(response.body, payload);
      expect(response.body.products).to.have.length(3);

      // Guardamos el ID para actualizar y eliminar este mismo carrito.
      cartId = response.body.id;
    });

    cy.then(() => {
      payload = {
        ...payload,
        products: [...payload.products, additionalProduct],
      };

      return cy.apiRequest('PUT', `/carts/${cartId}`, {
        headers,
        body: payload,
      });
    }).then((response) => {
      expectHttp(response, 200);
      expectJson(response);
      expectCartMatches(response.body, payload);
      expect(response.body.id, 'mismo carrito creado').to.eq(cartId);
      expect(response.body.products).to.have.length(4);
      expect(response.body.products).to.deep.include(additionalProduct);
    });

    cy.then(() => cy.apiRequest('DELETE', `/carts/${cartId}`, {
      headers,
    })).then((response) => {
      expectHttp(response, 200);
      expectJson(response);

      // Las escrituras de Fake Store son simuladas.
      // DELETE puede devolver null si el carrito creado no fue persistido.
      // Conservamos el ID original y no afirmamos una eliminación persistente.
      if (response.body === null) {
        expect(response.body, 'respuesta sin recurso persistido').to.eq(null);
        cy.log('DELETE devolvió null: no demuestra eliminación persistente. Ver README.');
      } else {
        expectCart(response.body);
        expect(response.body.id, 'ID del recurso devuelto por DELETE').to.eq(cartId);
        expect(response.body.userId).to.eq(payload.userId);
      }
    });
  });
});