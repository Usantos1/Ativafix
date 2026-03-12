#!/bin/bash

echo "🚀 Deploy Completo - Integração Telegram"
echo "=========================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Fazendo pull das alterações..."
git pull origin main

echo ""
echo "2️⃣ Instalando dependências (se necessário)..."
npm install

echo ""
echo "3️⃣ Fazendo build do frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend!"
    exit 1
fi

echo ""
echo "4️⃣ Verificando se dist/index.html foi criado..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: dist/index.html não foi criado!"
    exit 1
fi
echo "   ✅ dist/index.html existe"

echo ""
echo "5️⃣ Copiando frontend para servidor web..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
echo "   ✅ Arquivos copiados para /var/www/html/"

echo ""
echo "6️⃣ Recarregando Nginx..."
sudo systemctl reload nginx
echo "   ✅ Nginx recarregado"

echo ""
echo "7️⃣ Verificando se o servidor está rodando..."
if pm2 list | grep -q "primecamp-api"; then
    echo "   ✅ Servidor encontrado"
    echo ""
    echo "8️⃣ Reiniciando servidor..."
    pm2 restart primecamp-api
    
    echo ""
    echo "9️⃣ Aguardando 3 segundos para servidor inicializar..."
    sleep 3
    
    echo ""
    echo "🔟 Verificando status do servidor..."
    pm2 status
    
    echo ""
    echo "1️⃣1️⃣ Testando endpoint /api/upsert..."
    API_URL="https://api.ativafix.com/api"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${API_URL}/upsert/kv_store_2c4defad \
      -H "Content-Type: application/json" \
      -d '{"data": {"key": "test_deploy", "value": {"test": true}}, "onConflict": "key"}' 2>/dev/null)
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ]; then
        echo "   ✅ Endpoint /api/upsert está funcionando! (HTTP $RESPONSE)"
    else
        echo "   ⚠️ Endpoint retornou HTTP $RESPONSE"
        echo "   Verifique os logs: pm2 logs primecamp-api"
    fi
else
    echo "   ⚠️ Servidor não encontrado no PM2"
    echo "   Verifique: pm2 list"
fi

echo ""
echo "✅ Deploy completo!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "   2. Acesse: https://app.ativafix.com/integracoes"
echo "   3. Configure os Chat IDs do Telegram"
echo "   4. Teste salvando as configurações"

