#!/bin/bash

echo "🔍 VERIFICANDO NGINX E TESTANDO ROTAS DE REVENDA"
echo "================================================="
echo ""

# 1. Verificar configuração do Nginx
echo "1️⃣ Verificando configuração do Nginx..."
echo ""
echo "Configuração de /api:"
cat /etc/nginx/sites-available/ativafix.conf | grep -A 15 "location /api" || echo "Não encontrado"
echo ""

# 2. Verificar se Nginx está passando para localhost:3000
echo "2️⃣ Verificando se Nginx está configurado para passar /api para localhost:3000..."
if grep -q "proxy_pass.*3000" /etc/nginx/sites-available/ativafix.conf; then
    echo "✅ Nginx está configurado para passar para porta 3000"
else
    echo "⚠️  Nginx pode não estar configurado corretamente"
fi
echo ""

# 3. Testar rota diretamente no localhost (sem Nginx)
echo "3️⃣ Testando rota diretamente no localhost:3000 (sem Nginx)..."
echo "   GET /api/admin/revenda/test"
RESPONSE_LOCAL=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3000/api/admin/revenda/test)
HTTP_CODE_LOCAL=$(echo "$RESPONSE_LOCAL" | grep "HTTP_CODE" | cut -d: -f2)
BODY_LOCAL=$(echo "$RESPONSE_LOCAL" | sed '/HTTP_CODE/d')
echo "   Status: $HTTP_CODE_LOCAL"
echo "   Resposta: $BODY_LOCAL"
echo ""

# 4. Testar via Nginx (api.ativafix)
echo "4️⃣ Testando rota via Nginx (api.ativafix)..."
echo "   GET https://api.ativafix.com/api/admin/revenda/test"
RESPONSE_NGINX=$(curl -s -w "\nHTTP_CODE:%{http_code}" https://api.ativafix.com/api/admin/revenda/test)
HTTP_CODE_NGINX=$(echo "$RESPONSE_NGINX" | grep "HTTP_CODE" | cut -d: -f2)
BODY_NGINX=$(echo "$RESPONSE_NGINX" | sed '/HTTP_CODE/d')
echo "   Status: $HTTP_CODE_NGINX"
echo "   Resposta: $BODY_NGX"
echo ""

# 5. Comparar resultados
echo "5️⃣ Comparação:"
if [ "$HTTP_CODE_LOCAL" = "401" ] && [ "$HTTP_CODE_NGINX" = "401" ]; then
    echo "✅ Ambas as rotas retornam 401 (esperado - precisa autenticação)"
    echo "   Isso significa que as rotas estão funcionando!"
elif [ "$HTTP_CODE_LOCAL" = "401" ] && [ "$HTTP_CODE_NGINX" = "404" ]; then
    echo "⚠️  Rota funciona em localhost mas não via Nginx"
    echo "   Problema na configuração do Nginx!"
elif [ "$HTTP_CODE_LOCAL" = "404" ]; then
    echo "❌ Rota não funciona nem em localhost"
    echo "   Problema no servidor Node.js!"
else
    echo "⚠️  Status inesperado: localhost=$HTTP_CODE_LOCAL, nginx=$HTTP_CODE_NGINX"
fi
echo ""

# 6. Verificar logs do PM2 para rotas de revenda
echo "6️⃣ Verificando logs do PM2 para rotas de revenda..."
pm2 logs primecamp-api --lines 50 --nostream | grep -i "revenda\|plans\|companies" | tail -10
echo ""

echo "✅ Verificação concluída!"

