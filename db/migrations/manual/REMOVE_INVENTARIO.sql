-- Remove o fluxo dedicado de inventario (contagem/aprovacao).
-- Mantem produto_movimentacoes, pois ela tambem rastreia ajustes manuais,
-- vendas, OS, devolucoes e alteracoes de preco/custo.

ALTER TABLE IF EXISTS public.produto_movimentacoes
  DROP CONSTRAINT IF EXISTS produto_movimentacoes_inventario_id_fkey;

DROP INDEX IF EXISTS public.idx_produto_mov_inventario_id;

ALTER TABLE IF EXISTS public.produto_movimentacoes
  DROP COLUMN IF EXISTS inventario_id;

DO $$
BEGIN
  IF to_regclass('public.recursos') IS NOT NULL THEN
    DELETE FROM public.recursos
    WHERE slug = 'inventario';
  END IF;

  IF to_regclass('public.modulos') IS NOT NULL THEN
    UPDATE public.modulos
    SET path = '/produtos',
        label_menu = 'Estoque',
        nome = 'Estoque',
        descricao = 'Controle de estoque',
        icone = 'package'
    WHERE slug = 'estoque';
  END IF;
END $$;

DROP TABLE IF EXISTS public.inventario_itens;
DROP TABLE IF EXISTS public.inventarios;
