-- Vincula roles a segmentos: cada segmento pode ter seus próprios roles (ex.: oficina tem role de oficina).
-- segmento_slug NULL = role global (visível para todos os segmentos).

ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS segmento_slug VARCHAR(50) NULL;

COMMENT ON COLUMN public.roles.segmento_slug IS 'Slug do segmento (ex: oficina_mecanica). NULL = role global.';

-- Índice para filtrar roles por segmento
CREATE INDEX IF NOT EXISTS idx_roles_segmento_slug ON public.roles(segmento_slug);

-- Unicidade: mesmo name pode existir em segmentos diferentes, mas não duplicar (name, segmento_slug)
-- Remover UNIQUE(name) se existir e criar UNIQUE(name, segmento_slug) - opcional, pode deixar name único global e usar convenção name = oficina_admin para segmento
-- Por simplicidade mantemos name UNIQUE e usamos segmento_slug só para filtrar exibição. Roles de segmento terão names como oficina_gerente, oficina_tecnico.
-- Inserir role padrão para Oficina Mecânica (se não existir)
INSERT INTO public.roles (name, display_name, description, is_system, segmento_slug)
SELECT 'role_oficina', 'Oficina', 'Função para usuários do segmento oficina (OS, clientes, veículos, orçamentos)', false, 'oficina_mecanica'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'role_oficina');
