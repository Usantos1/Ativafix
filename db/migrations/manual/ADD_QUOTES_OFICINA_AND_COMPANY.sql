-- Orçamentos: company_id (multi-empresa) + campos para oficina (veículo, condições, garantias)
-- Execute após CRIAR_TABELAS_ORCAMENTOS.sql

-- 1. company_id em quotes (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'company_id') THEN
    ALTER TABLE public.quotes ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON public.quotes(company_id);
    RAISE NOTICE 'Coluna company_id adicionada em quotes.';
  END IF;
END $$;

-- 2. Campos de veículo e texto para oficina
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'veiculo_modelo') THEN
    ALTER TABLE public.quotes ADD COLUMN veiculo_modelo TEXT;
    RAISE NOTICE 'quotes.veiculo_modelo adicionado.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'veiculo_ano') THEN
    ALTER TABLE public.quotes ADD COLUMN veiculo_ano TEXT;
    RAISE NOTICE 'quotes.veiculo_ano adicionado.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'veiculo_versao') THEN
    ALTER TABLE public.quotes ADD COLUMN veiculo_versao TEXT;
    RAISE NOTICE 'quotes.veiculo_versao adicionado.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'consumidor_apenas') THEN
    ALTER TABLE public.quotes ADD COLUMN consumidor_apenas BOOLEAN DEFAULT false;
    RAISE NOTICE 'quotes.consumidor_apenas adicionado.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'condicoes_texto') THEN
    ALTER TABLE public.quotes ADD COLUMN condicoes_texto TEXT;
    RAISE NOTICE 'quotes.condicoes_texto adicionado.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'garantias_texto') THEN
    ALTER TABLE public.quotes ADD COLUMN garantias_texto TEXT;
    RAISE NOTICE 'quotes.garantias_texto adicionado.';
  END IF;
END $$;

-- 3. quote_items: permitir tipo 'peca' e 'mao_de_obra' (opcional; se o CHECK existir, pode ser alterado)
DO $$
BEGIN
  ALTER TABLE public.quote_items DROP CONSTRAINT IF EXISTS quote_items_produto_tipo_check;
  ALTER TABLE public.quote_items ADD CONSTRAINT quote_items_produto_tipo_check
    CHECK (produto_tipo IS NULL OR produto_tipo IN ('produto', 'servico', 'peca', 'mao_de_obra'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint quote_items_produto_tipo_check: %', SQLERRM;
END $$;
