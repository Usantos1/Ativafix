-- ============================================
-- TABELA VEÍCULOS (oficina / multi-empresa)
-- Um cliente ou empresa pode ter vários veículos.
-- Cada veículo tem próxima revisão e próxima manutenção para o gestor ligar ou enviar lembrete.
-- ============================================

CREATE TABLE IF NOT EXISTS public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,

  -- Identificação do veículo
  placa TEXT,
  marca_id UUID REFERENCES public.marcas(id) ON DELETE SET NULL,
  modelo_id UUID REFERENCES public.modelos(id) ON DELETE SET NULL,
  marca_nome TEXT,
  modelo_nome TEXT,
  ano TEXT,
  versao TEXT,
  cor TEXT,
  km_atual NUMERIC(12,2),

  -- Próxima revisão (gestor sabe quando ligar/enviar lembrete)
  proxima_revisao_data DATE,
  proxima_revisao_km NUMERIC(12,2),
  proxima_revisao_obs TEXT,

  -- Próxima manutenção (tipo: troca de óleo, revisão 10k, etc.)
  proxima_manutencao_data DATE,
  proxima_manutencao_tipo TEXT,
  proxima_manutencao_obs TEXT,

  -- Última revisão/manutenção (histórico rápido)
  ultima_revisao_data DATE,
  ultima_manutencao_data DATE,

  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_veiculos_company_id ON public.veiculos(company_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_id ON public.veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON public.veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_marca_id ON public.veiculos(marca_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_modelo_id ON public.veiculos(modelo_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_proxima_revisao ON public.veiculos(proxima_revisao_data);
CREATE INDEX IF NOT EXISTS idx_veiculos_proxima_manutencao ON public.veiculos(proxima_manutencao_data);
CREATE INDEX IF NOT EXISTS idx_veiculos_created_at ON public.veiculos(created_at DESC);

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_veiculos_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_veiculos_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_veiculos_updated_at ON public.veiculos;
CREATE TRIGGER trigger_veiculos_updated_at
  BEFORE UPDATE ON public.veiculos
  FOR EACH ROW
  EXECUTE PROCEDURE update_veiculos_updated_at();

COMMENT ON TABLE public.veiculos IS 'Cadastro de veículos por cliente; prazos de revisão e manutenção para gestor/CRM';
