-- Adiciona etiqueta automática do Ativa CRM na configuração de pós-venda.
-- Aplicar na VPS:
-- psql "$DATABASE_URL" -f db/migrations/manual/OS_FOLLOWUP_POS_VENDA_TAG_ATIVA_CRM.sql

ALTER TABLE public.os_pos_venda_followup_settings
  ADD COLUMN IF NOT EXISTS ativa_crm_tag_id INTEGER NULL;

COMMENT ON COLUMN public.os_pos_venda_followup_settings.ativa_crm_tag_id
  IS 'ID da etiqueta no Ativa CRM aplicada ao contato/ticket quando o follow-up de pós-venda é enviado.';
