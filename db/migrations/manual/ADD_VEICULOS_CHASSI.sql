-- Adiciona coluna chassi na tabela veiculos (para cadastro no perfil do cliente)
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS chassi TEXT;
