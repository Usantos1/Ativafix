-- Cargos (roles) com módulos, recursos e tela inicial — igual ao sistema de segmentos.
-- Permite definir por cargo: quais módulos o colaborador vê, em que ordem no menu, e qual a tela inicial (ex.: PDV para vendedor).

-- 1. Tela inicial do cargo (ex.: /pdv para vendedor)
ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS home_path VARCHAR(255) NULL;
COMMENT ON COLUMN public.roles.home_path IS 'Rota inicial do colaborador com este cargo (ex: /pdv). NULL = dashboard (/)';

-- 2. Módulos por cargo (quais módulos o cargo vê + ordem no menu)
CREATE TABLE IF NOT EXISTS public.role_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  ordem_menu INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, modulo_id)
);
CREATE INDEX IF NOT EXISTS idx_role_modulos_role ON public.role_modulos(role_id);
CREATE INDEX IF NOT EXISTS idx_role_modulos_modulo ON public.role_modulos(modulo_id);

-- 3. Recursos por cargo (quais recursos o cargo tem dentro dos módulos)
CREATE TABLE IF NOT EXISTS public.role_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  recurso_id UUID NOT NULL REFERENCES public.recursos(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, recurso_id)
);
CREATE INDEX IF NOT EXISTS idx_role_recursos_role ON public.role_recursos(role_id);
CREATE INDEX IF NOT EXISTS idx_role_recursos_recurso ON public.role_recursos(recurso_id);
