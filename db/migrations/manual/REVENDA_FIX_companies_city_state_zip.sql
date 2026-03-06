-- =====================================================
-- FIX: Adicionar colunas city, state, zip_code na tabela companies (revenda)
-- Use quando a API retornar 500 com: column "city" of relation "companies" does not exist
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'city') THEN
    ALTER TABLE public.companies ADD COLUMN city VARCHAR(100);
    RAISE NOTICE 'Coluna city adicionada em companies.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'state') THEN
    ALTER TABLE public.companies ADD COLUMN state VARCHAR(2);
    RAISE NOTICE 'Coluna state adicionada em companies.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'zip_code') THEN
    ALTER TABLE public.companies ADD COLUMN zip_code VARCHAR(10);
    RAISE NOTICE 'Coluna zip_code adicionada em companies.';
  END IF;
END $$;
