#!/usr/bin/env node
/**
 * Cria form-data/index.js para resolver erro na VPS:
 * "Cannot find package '.../form-data/index.js'"
 * O pacote form-data só tem main: "./lib/form_data", sem index.js.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const formDataDir = path.join(__dirname, '..', 'node_modules', 'form-data');
const indexPath = path.join(formDataDir, 'index.js');
const content = "module.exports = require('./lib/form_data');\n";

if (fs.existsSync(formDataDir) && !fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, content);
  console.log('[postinstall] Criado form-data/index.js');
}
