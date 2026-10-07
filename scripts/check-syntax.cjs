const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

function check(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) check(path);
    else if (/\.(js|cjs)$/.test(path)) execFileSync(process.execPath, ['--check', path], { stdio: 'inherit' });
  }
}
check('cypress');
check('scripts');
execFileSync(process.execPath, ['--check', 'cypress.config.js'], { stdio: 'inherit' });
console.log('Sintaxis JavaScript correcta. Este chequeo no ejecuta pruebas funcionales.');
