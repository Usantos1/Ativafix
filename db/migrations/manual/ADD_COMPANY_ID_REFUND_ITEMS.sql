-- Alinha refund_items com o filtro automático por company_id em server/index.js
-- Erro típico sem esta coluna: column refund_items.company_id does not exist

ALTER TABLE refund_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

UPDATE refund_items ri
SET company_id = r.company_id
FROM refunds r
WHERE ri.refund_id = r.id
  AND r.company_id IS NOT NULL
  AND (ri.company_id IS NULL OR ri.company_id IS DISTINCT FROM r.company_id);

CREATE INDEX IF NOT EXISTS idx_refund_items_company_id ON refund_items(company_id);

-- Opcional: revisar linhas órfãs (sem company_id após o UPDATE)
-- SELECT ri.id, ri.refund_id FROM refund_items ri WHERE ri.company_id IS NULL;
