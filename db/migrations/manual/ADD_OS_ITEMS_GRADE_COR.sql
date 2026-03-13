-- ============================================
-- Coluna grade_cor em os_items (grade por cor para devolução de estoque)
-- Erro no console: column "grade_cor" does not exist
-- Execute no PostgreSQL que a API usa (ex: api.ativafix.com / VPS).
-- ============================================

-- Com aro / sem aro (telas) — garantir que existe
ALTER TABLE public.os_items
  ADD COLUMN IF NOT EXISTS com_aro VARCHAR(20);

COMMENT ON COLUMN public.os_items.com_aro IS 'Grade: com_aro ou sem_aro (telas). Controle interno.';

-- Grade por cor (tampas, etc.)
ALTER TABLE public.os_items
  ADD COLUMN IF NOT EXISTS grade_cor VARCHAR(100);

COMMENT ON COLUMN public.os_items.grade_cor IS 'Grade por cor do item (ex: Preto, Branco). Usado na devolução de estoque.';
