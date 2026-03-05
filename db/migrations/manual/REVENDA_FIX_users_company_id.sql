-- =====================================================
-- FIX: Adicionar company_id na tabela users (revenda)
-- Use este script se /admin/revenda retornar 500 ou 503
-- e a mensagem falar em "company_id" ou "estrutura do banco".
-- =====================================================

DO $$
DECLARE
  admin_company_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN company_id UUID;
    UPDATE public.users SET company_id = admin_company_id WHERE company_id IS NULL;
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_company_revenda
      FOREIGN KEY (company_id) REFERENCES public.companies(id);
    ALTER TABLE public.users ALTER COLUMN company_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
    RAISE NOTICE 'Coluna company_id adicionada em users com sucesso.';
  ELSE
    RAISE NOTICE 'Coluna company_id já existe em users.';
  END IF;
END $$;
