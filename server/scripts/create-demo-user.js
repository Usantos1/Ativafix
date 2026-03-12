/**
 * Cria o usuário de demonstração no banco (email e senha vêm do .env).
 * Rodar na raiz do projeto: node server/scripts/create-demo-user.js
 * Ou, de dentro de server/: node scripts/create-demo-user.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env na raiz do projeto (pasta que contém server/)
const envPath = join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const email = (process.env.DEMO_EMAIL || process.env.DEMO_USER_EMAIL || '').trim().toLowerCase();
const password = process.env.DEMO_PASSWORD || process.env.DEMO_USER_PASSWORD;

if (!email || !password) {
  console.error('❌ Defina DEMO_EMAIL e DEMO_PASSWORD no .env da raiz do projeto.');
  process.exit(1);
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

/** Nome da empresa usada só para a demo — dados isolados da sua empresa real. */
const DEMO_COMPANY_NAME = 'Ativa FIX - Demonstração';

async function getOrCreateDemoCompany(client) {
  let r = await client.query(
    `SELECT id FROM companies WHERE name = $1 AND (deleted_at IS NULL) LIMIT 1`,
    [DEMO_COMPANY_NAME]
  );
  if (r.rows.length > 0) return r.rows[0].id;

  r = await client.query(
    `INSERT INTO companies (name, email, status) VALUES ($1, $2, 'trial') RETURNING id`,
    [DEMO_COMPANY_NAME, 'demo@ativafix.com']
  );
  return r.rows[0].id;
}

async function main() {
  const client = await pool.connect();
  try {
    const demoCompanyId = await getOrCreateDemoCompany(client);

    const existing = await client.query('SELECT id, company_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (user.company_id !== demoCompanyId) {
        await client.query('UPDATE users SET company_id = $1 WHERE id = $2', [demoCompanyId, user.id]);
        console.log('✅ Usuário demo movido para a empresa de demonstração (dados isolados).');
      } else {
        console.log('✅ Usuário demo já existe e já está na empresa de demonstração:', email);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (id, email, password_hash, email_verified, company_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, true, $3, NOW())
       RETURNING id`,
      [email, passwordHash, demoCompanyId]
    );
    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO profiles (id, user_id, display_name, role, approved, approved_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'Visitante Demo', 'admin', true, NOW(), NOW(), NOW())`,
      [userId]
    );

    console.log('✅ Usuário demo criado:', email, '(apenas empresa demonstração, company_id:', demoCompanyId + ')');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
