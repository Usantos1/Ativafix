#!/bin/bash

echo "🔄 Completando Deploy da Integração Telegram"
echo "============================================"
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando se há alterações pendentes..."
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "   ⚠️ Há alterações no remoto. Fazendo pull..."
    git pull origin main
else
    echo "   ✅ Código já está atualizado"
fi

echo ""
echo "2️⃣ Verificando se o servidor está rodando..."
if pm2 list | grep -q "primecamp-api"; then
    echo "   ✅ Servidor encontrado"
    echo ""
    echo "3️⃣ Reiniciando servidor para carregar novo endpoint /api/upsert..."
    pm2 restart primecamp-api
    
    echo ""
    echo "4️⃣ Aguardando 3 segundos para servidor inicializar..."
    sleep 3
    
    echo ""
    echo "5️⃣ Verificando logs do servidor..."
    pm2 logs primecamp-api --lines 20 --nostream
    
    echo ""
    echo "6️⃣ Testando endpoint /api/upsert..."
    API_URL="https://api.ativafix.com/api"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${API_URL}/upsert/kv_store_2c4defad \
      -H "Content-Type: application/json" \
      -d '{"data": {"key": "test_deploy", "value": {"test": true}}, "onConflict": "key"}' 2>/dev/null)
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
        echo "   ✅ Endpoint /api/upsert está funcionando! (HTTP $RESPONSE)"
    else
        echo "   ⚠️ Endpoint retornou HTTP $RESPONSE"
        echo "   Verifique os logs: pm2 logs primecamp-api"
        echo "   Teste manualmente: curl -X POST ${API_URL}/upsert/kv_store_2c4defad -H 'Content-Type: application/json' -d '{\"data\": {\"key\": \"test\", \"value\": {}}, \"onConflict\": \"key\"}'"
    fi
else
    echo "   ⚠️ Servidor não encontrado no PM2"
    echo "   Verifique: pm2 list"
    echo "   Ou inicie manualmente: pm2 start server/index.js --name primecamp-api"
fi

echo ""
echo "✅ Deploy completo!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Acesse: https://seu-dominio.com/integracoes"
echo "   2. Configure os Chat IDs do Telegram"
echo "   3. Teste salvando as configurações"

