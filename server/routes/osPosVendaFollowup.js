/**
 * API: configuração e fila de follow-up pós-venda (WhatsApp).
 */
import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  getSettingsRow,
  mergeSettingsResponse,
  upsertSettings,
  scheduleFollowupForOs,
} from '../services/osPosVendaFollowupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const router = express.Router();
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const requireCompanyId = (req, res, next) => {
  if (!req.companyId) {
    return res.status(403).json({
      error: 'Usuário sem empresa vinculada.',
      codigo: 'COMPANY_ID_REQUIRED',
    });
  }
  next();
};

router.use(requireCompanyId);

router.get('/settings', async (req, res) => {
  try {
    const row = await getSettingsRow(pool, req.companyId);
    res.json(mergeSettingsResponse(row));
  } catch (e) {
    console.error('[OS Follow-up] GET settings:', e);
    res.status(500).json({ error: e.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    await upsertSettings(pool, req.companyId, req.body || {});
    const row = await getSettingsRow(pool, req.companyId);
    res.json(mergeSettingsResponse(row));
  } catch (e) {
    console.error('[OS Follow-up] PUT settings:', e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const r = await pool.query(
      `SELECT j.id, j.ordem_servico_id, j.telefone, j.status, j.tipo_regra_envio,
              j.scheduled_at, j.sent_at, j.faturado_at, j.error_message, j.skip_reason,
              j.random_delay_seconds, j.created_at,
              o.numero AS numero_os,
              o.cliente_nome,
              o.telefone_contato,
              o.marca_nome,
              o.modelo_nome,
              LEFT(mensagem_renderizada, 200) AS mensagem_preview
       FROM os_pos_venda_followup_jobs j
       LEFT JOIN ordens_servico o ON o.id = j.ordem_servico_id
       WHERE j.company_id = $1
       ORDER BY j.created_at DESC
       LIMIT $2`,
      [req.companyId, limit]
    );
    res.json({ jobs: r.rows });
  } catch (e) {
    console.error('[OS Follow-up] GET jobs:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const { ordem_servico_id, faturado_at } = req.body || {};
    if (!ordem_servico_id) {
      return res.status(400).json({ error: 'ordem_servico_id obrigatório' });
    }
    const result = await scheduleFollowupForOs(
      pool,
      req.companyId,
      ordem_servico_id,
      faturado_at || null
    );
    res.json(result);
  } catch (e) {
    console.error('[OS Follow-up] POST schedule:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
