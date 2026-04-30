-- Permite configurar por empresa/status qual etiqueta do Ativa CRM aplicar ao ticket da OS.
-- Rodar na VPS no mesmo banco usado pela API.

ALTER TABLE public.os_config_status
  ADD COLUMN IF NOT EXISTS ativa_crm_tag_id INTEGER;

COMMENT ON COLUMN public.os_config_status.ativa_crm_tag_id IS
  'ID da etiqueta no Ativa CRM aplicada quando a OS entra neste status.';

-- Mantém o comportamento padrão existente para empresas que ainda não configuraram manualmente.
UPDATE public.os_config_status
SET ativa_crm_tag_id = 2716
WHERE ativa_crm_tag_id IS NULL
  AND status IN ('aberta', 'aprovado', 'em_andamento', 'em_manutencao', 'em_manutenção');

UPDATE public.os_config_status
SET ativa_crm_tag_id = 2717
WHERE ativa_crm_tag_id IS NULL
  AND (
    status IN ('finalizada', 'entregue', 'entregue_faturada', 'manutencao_finalizada', 'manutenção_finalizada')
    OR LOWER(label) LIKE '%manutenção realizada%'
    OR LOWER(label) LIKE '%manutencao realizada%'
    OR LOWER(label) LIKE '%finalizada%'
  );
