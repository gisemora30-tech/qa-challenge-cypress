const { writeFileSync, existsSync } = require('node:fs');

async function main() {
  if (existsSync('cypress.env.json')) {
    throw new Error('cypress.env.json ya existe. Revisalo manualmente; no se sobrescribe.');
  }
  // Solo para Fake Store: sus usuarios y passwords son datos públicos de demostración.
  // No debe utilizarse este patrón para obtener credenciales de un sistema real.
  const response = await fetch('https://fakestoreapi.com/users', {
    signal: AbortSignal.timeout(30000),
  });
  if (response.status !== 200) {
    throw new Error(`GET /users devolvió HTTP ${response.status}. No se generó la configuración.`);
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('GET /users no devolvió JSON. No se generó la configuración.');
  }
  const users = await response.json();
  if (!Array.isArray(users) || users.length === 0) throw new Error('Listado de usuarios inválido.');
  const user = users.find((item) => Number.isInteger(item.id) && item.id > 0
    && typeof item.username === 'string' && item.username.length > 0
    && typeof item.password === 'string' && item.password.length > 0);
  if (!user) throw new Error('No hay un usuario de demostración válido en la respuesta.');
  writeFileSync('cypress.env.json', `${JSON.stringify({
    apiUsername: user.username,
    apiPassword: user.password,
    apiUserId: user.id,
  }, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  console.log('cypress.env.json creado con un usuario público de Fake Store. No lo subas a GitHub.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
