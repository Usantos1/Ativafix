-- =====================================================
-- FIX: Adicionar coluna deleted_at na tabela companies (revenda)
-- Use quando a API retornar 503 com detail: "column c.deleted_at does not exist"
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN deleted_at TIMESTAMPTZ;
    RAISE NOTICE 'Coluna deleted_at adicionada em companies com sucesso.';
  ELSE
    RAISE NOTICE 'Coluna deleted_at já existe em companies.';
  END IF;
END $$;
