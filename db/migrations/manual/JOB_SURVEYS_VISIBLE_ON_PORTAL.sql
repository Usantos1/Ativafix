-- Controle de exibição no portal público (/vagas e GET /api/public/vaga).
-- false = oculta da listagem e do acesso público por slug (admin continua vendo).

ALTER TABLE job_surveys
  ADD COLUMN IF NOT EXISTS visible_on_portal BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN job_surveys.visible_on_portal IS
  'Se false, a vaga não aparece no portal /vagas nem no endpoint público por slug; permanece no painel admin.';
