-- =====================================================
-- Assistência Técnica: adicionar módulos e recursos
-- Execute no mesmo banco onde rodou REVENDA_MULTI_SEGMENTO.sql
-- =====================================================

-- Vínculos: Assistência Técnica - Módulos (ordem do menu)
DO $$
DECLARE
    seg_id UUID;
    mod_id UUID;
    ord INTEGER;
    r RECORD;
BEGIN
    SELECT id INTO seg_id FROM public.segmentos WHERE slug = 'assistencia_tecnica' LIMIT 1;
    IF seg_id IS NULL THEN
        RAISE NOTICE 'Segmento assistencia_tecnica não encontrado. Rode REVENDA_MULTI_SEGMENTO.sql antes.';
        RETURN;
    END IF;

    ord := 0;
    FOR r IN (SELECT slug FROM (VALUES ('dashboard'), ('ordens_servico'), ('clientes'), ('orcamentos'), ('estoque'), ('produtos_pecas'), ('caixa'), ('financeiro'), ('relatorios'), ('painel_alertas')) AS t(slug))
    LOOP
        SELECT id INTO mod_id FROM public.modulos WHERE modulos.slug = r.slug LIMIT 1;
        IF mod_id IS NOT NULL THEN
            INSERT INTO public.segmentos_modulos (segmento_id, modulo_id, ativo, ordem_menu)
            VALUES (seg_id, mod_id, true, ord)
            ON CONFLICT (segmento_id, modulo_id) DO UPDATE SET ordem_menu = ord, ativo = true;
            ord := ord + 1;
        END IF;
    END LOOP;
    RAISE NOTICE 'Assistência Técnica: % módulos vinculados.', ord;
END $$;

-- Vínculos: Assistência Técnica - Recursos
INSERT INTO public.segmentos_recursos (segmento_id, recurso_id, ativo)
SELECT sm.segmento_id, r.id, true
FROM public.segmentos_modulos sm
JOIN public.recursos r ON r.modulo_id = sm.modulo_id
WHERE sm.segmento_id = (SELECT id FROM public.segmentos WHERE slug = 'assistencia_tecnica' LIMIT 1)
ON CONFLICT (segmento_id, recurso_id) DO UPDATE SET ativo = true;
