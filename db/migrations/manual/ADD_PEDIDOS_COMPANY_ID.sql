-- Adiciona company_id em pedidos para que todos os usuários da mesma empresa vejam os mesmos pedidos.
-- Executar no banco: psql ... -f db/migrations/manual/ADD_PEDIDOS_COMPANY_ID.sql

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS company_id UUID NULL;

COMMENT ON COLUMN public.pedidos.company_id IS 'Empresa dona do pedido; usuários da mesma empresa veem a mesma lista';

CREATE INDEX IF NOT EXISTS idx_pedidos_company_id
  ON public.pedidos (company_id);
