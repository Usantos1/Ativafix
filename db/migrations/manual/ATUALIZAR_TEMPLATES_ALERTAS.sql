-- =====================================================
-- ATUALIZAR TEMPLATES DOS ALERTAS (os.criada e caixa.fechado)
-- Aplica o novo padrão visual (negrito + separador ".")
-- e formatação de moeda automática (R$) via renderTemplate.
--
-- Seguro de rodar múltiplas vezes: só altera templates que
-- ainda estão no formato antigo/padrão. Templates já customizados
-- manualmente pela empresa NÃO são sobrescritos.
-- =====================================================

BEGIN;

-- 1) Atualizar catálogo (default usado por empresas sem template customizado)

UPDATE public.alert_catalog
SET template_padrao = E'*Nova ordem de serviço aberta*\n.\n*OS:* #{numero_os}\n.\n*Cliente:* {cliente}\n.\n*Aparelho:* {marca} {modelo}\n.\n*Defeito:* {defeito}\n.\n*Acompanhamento:* {link_os}\n.\n*Responsável:* {usuario}',
    variaveis_disponiveis = ARRAY['cliente','numero_os','marca','modelo','defeito','usuario','link_os','empresa'],
    updated_at = NOW()
WHERE codigo_alerta = 'os.criada';

UPDATE public.alert_catalog
SET template_padrao = E'*Caixa fechado com sucesso.*\n.\n*Usuário:* {usuario_caixa}\n.\n*Abertura:* {valor_abertura}\n.\n*Fechamento:* {valor_fechamento}\n.\n*Total em vendas:* {total_vendas}\n.\n*Responsável:* {usuario}',
    variaveis_disponiveis = ARRAY['valor_abertura','valor_fechamento','total_vendas','usuario_caixa','usuario'],
    updated_at = NOW()
WHERE codigo_alerta = 'caixa.fechado';

-- 2) Atualizar configurações por empresa que ainda estão com o template antigo
--    (comparamos com a mensagem antiga exata; qualquer customização diferente é preservada)

UPDATE public.alert_config
SET template_mensagem = E'*Nova ordem de serviço aberta*\n.\n*OS:* #{numero_os}\n.\n*Cliente:* {cliente}\n.\n*Aparelho:* {marca} {modelo}\n.\n*Defeito:* {defeito}\n.\n*Acompanhamento:* {link_os}\n.\n*Responsável:* {usuario}',
    updated_at = NOW()
WHERE codigo_alerta = 'os.criada'
  AND (
    template_mensagem IS NULL
    OR template_mensagem = E'Nova ordem de serviço aberta.\n\nOS: #{numero_os}\nCliente: {cliente}\nAparelho: {marca} {modelo}\nDefeito: {defeito}\nResponsável: {usuario}\nAcompanhamento: {link_os}'
  );

UPDATE public.alert_config
SET template_mensagem = E'*Caixa fechado com sucesso.*\n.\n*Usuário:* {usuario_caixa}\n.\n*Abertura:* {valor_abertura}\n.\n*Fechamento:* {valor_fechamento}\n.\n*Total em vendas:* {total_vendas}\n.\n*Responsável:* {usuario}',
    updated_at = NOW()
WHERE codigo_alerta = 'caixa.fechado'
  AND (
    template_mensagem IS NULL
    OR template_mensagem = E'Caixa fechado com sucesso.\n\nAbertura: {valor_abertura}\nFechamento: {valor_fechamento}\nTotal em vendas: {total_vendas}\nResponsável: {usuario}'
  );

COMMIT;

-- Conferência (opcional):
-- SELECT codigo_alerta, template_padrao FROM public.alert_catalog WHERE codigo_alerta IN ('os.criada','caixa.fechado');
-- SELECT company_id, codigo_alerta, template_mensagem FROM public.alert_config WHERE codigo_alerta IN ('os.criada','caixa.fechado');
