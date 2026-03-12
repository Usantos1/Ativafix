#!/bin/bash

echo "🔧 RESOLVENDO ERRO 404 - API TOKENS"
echo "===================================="
echo ""

cd /root/primecamp-ofc || { echo "❌ Erro: Não foi possível entrar no diretório"; exit 1; }

echo "1. Verificando se há mudanças não commitadas..."
git status --short

echo ""
echo "2. Verificando se o servidor está rodando..."
if ! pm2 list | grep -q "primecamp-api"; then
    echo "❌ Servidor NÃO está rodando! Iniciando..."
    cd server
    pm2 start index.js --name primecamp-api
    sleep 3
    cd ..
else
    echo "✅ Servidor está rodando"
fi

echo ""
echo "3. Verificando se a rota de teste existe no código..."
if grep -q "/api/api-tokens/test" server/index.js; then
    echo "✅ Rota de teste encontrada no código"
else
    echo "⚠️  Rota de teste não encontrada, adicionando..."
    # Isso será feito manualmente se necessário
fi

echo ""
echo "4. REINICIANDO SERVIDOR para garantir que está usando o código atualizado..."
pm2 restart primecamp-api
sleep 3

echo ""
echo "5. Verificando logs após reinicialização..."
pm2 logs primecamp-api --lines 30 --nostream | tail -20

echo ""
echo "6. Testando rota de teste..."
sleep 2
TEST_RESPONSE=$(curl -s http://localhost:3000/api/api-tokens/test 2>&1)
echo "   Resposta: $TEST_RESPONSE"

if echo "$TEST_RESPONSE" | grep -q "funcionando"; then
    echo "✅ Rota de teste funcionando!"
else
    echo "❌ Rota de teste ainda não funciona"
    echo ""
    echo "7. Verificando se o servidor está escutando na porta correta..."
    netstat -tlnp | grep 3000 || ss -tlnp | grep 3000
fi

echo ""
echo "8. Verificando se há erros nos logs..."
pm2 logs primecamp-api --lines 50 --nostream | grep -i "erro\|error\|404\|not found" | tail -10 || echo "   Nenhum erro encontrado nos logs recentes"

echo ""
echo "9. Verificando se as tabelas existem..."
TABLES=$(psql -U postgres -d banco_gestao -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('api_tokens', 'api_access_logs');" 2>/dev/null)
if [ "$TABLES" = "2" ]; then
    echo "✅ Tabelas existem no banco"
else
    echo "⚠️  Tabelas podem não existir (encontradas: $TABLES/2)"
fi

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Se a rota de teste não funcionar, verifique:"
echo "   - pm2 logs primecamp-api --lines 100"
echo "   - Procure por erros de inicialização"
echo ""
echo "2. Teste no navegador:"
echo "   https://api.ativafix.com/api/api-tokens/test"
echo ""
echo "3. Se ainda der 404, pode ser problema de proxy/nginx:"
echo "   sudo systemctl status nginx"
echo "   sudo nginx -t"

