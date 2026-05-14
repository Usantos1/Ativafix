-- ============================================
-- ADICIONAR PREÇOS POR CONDIÇÃO COMERCIAL NA OS
-- ============================================
-- Compatível com dados existentes:
-- - valor_vista e valor_parcelado recebem fallback do valor_unitario atual.
-- - metadados em os_pagamentos preservam a condição usada no faturamento.

ALTER TABLE public.os_items
  ADD COLUMN IF NOT EXISTS valor_vista NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS valor_parcelado NUMERIC(12,2);

UPDATE public.os_items
SET
  valor_vista = COALESCE(valor_vista, valor_unitario),
  valor_parcelado = COALESCE(valor_parcelado, valor_unitario)
WHERE valor_vista IS NULL OR valor_parcelado IS NULL;

ALTER TABLE public.os_pagamentos
  ADD COLUMN IF NOT EXISTS condicao_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS total_original NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS total_final NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS desconto_aplicado NUMERIC(12,2);

UPDATE public.os_pagamentos
SET
  total_original = COALESCE(total_original, valor),
  total_final = COALESCE(total_final, valor),
  desconto_aplicado = COALESCE(desconto_aplicado, 0)
WHERE total_original IS NULL
   OR total_final IS NULL
   OR desconto_aplicado IS NULL;
