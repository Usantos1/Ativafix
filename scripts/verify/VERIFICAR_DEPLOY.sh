#!/bin/bash

echo "🔍 VERIFICANDO DEPLOY - Diagnóstico Completo"
echo "=============================================="
echo ""

NGINX_ROOT="/var/www/ativafix"

echo "1️⃣ Verificando arquivos JS no servidor..."
echo "   Arquivos disponíveis:"
ls -lh "$NGINX_ROOT/assets/" | grep "index-.*\.js" | grep -v "\.es\.js" | head -5

echo ""
echo "2️⃣ Verificando referência no index.html..."
echo "   Referência encontrada:"
grep -o 'assets/index-[^"]*\.js' "$NGINX_ROOT/index.html" | head -1

echo ""
echo "3️⃣ Comparando arquivo referenciado vs disponível..."
REFERENCED=$(grep -o 'assets/index-[^"]*\.js' "$NGINX_ROOT/index.html" | head -1 | sed 's|assets/||')
ACTUAL=$(ls "$NGINX_ROOT/assets/"index-*.js 2>/dev/null | grep -v "\.es\.js" | head -1 | xargs basename)

echo "   Referenciado no HTML: $REFERENCED"
echo "   Arquivo disponível:   $ACTUAL"

if [ "$REFERENCED" = "$ACTUAL" ]; then
    echo "   ✅ CORRETO - Arquivos coincidem"
else
    echo "   ❌ ERRO - Arquivos NÃO coincidem!"
    echo "   Isso explica por que não funciona!"
fi

echo ""
echo "4️⃣ Verificando se o index.html tem o código de desregistro de SW..."
if grep -q "Service Worker desregistrado" "$NGINX_ROOT/index.html"; then
    echo "   ✅ Código de desregistro encontrado"
else
    echo "   ❌ Código de desregistro NÃO encontrado!"
fi

echo ""
echo "5️⃣ Verificando data de modificação do index.html..."
stat "$NGINX_ROOT/index.html" | grep Modify

echo ""
echo "6️⃣ Verificando hash do arquivo JS principal..."
if [ -f "$NGINX_ROOT/assets/$ACTUAL" ]; then
    echo "   Tamanho: $(ls -lh "$NGINX_ROOT/assets/$ACTUAL" | awk '{print $5}')"
    echo "   Data: $(stat "$NGINX_ROOT/assets/$ACTUAL" | grep Modify | awk '{print $2, $3}')"
else
    echo "   ❌ Arquivo não encontrado!"
fi

echo ""
echo "7️⃣ Verificando se há versionamento (?v=) no index.html..."
if grep -q "assets/index-.*\.js?v=" "$NGINX_ROOT/index.html"; then
    echo "   ✅ Versionamento encontrado"
    grep -o 'assets/index-[^"]*\.js?v=[^"]*' "$NGINX_ROOT/index.html" | head -1
else
    echo "   ⚠️ Versionamento NÃO encontrado (pode ser normal se não foi aplicado)"
fi

echo ""
echo "8️⃣ Verificando configuração do Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/ativafix"
if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "Cache-Control.*no-cache" "$NGINX_CONFIG"; then
        echo "   ✅ Headers anti-cache configurados"
    else
        echo "   ⚠️ Headers anti-cache NÃO configurados"
    fi
else
    echo "   ⚠️ Arquivo de configuração não encontrado em $NGINX_CONFIG"
fi

echo ""
echo "=============================================="
echo "📋 RESUMO:"
echo ""
if [ "$REFERENCED" = "$ACTUAL" ]; then
    echo "✅ Arquivos estão corretos no servidor"
    echo ""
    echo "Se ainda não funciona no navegador, o problema pode ser:"
    echo "1. CDN ou proxy intermediário fazendo cache"
    echo "2. Extensões do navegador interferindo"
    echo "3. DNS ainda apontando para servidor antigo"
else
    echo "❌ PROBLEMA ENCONTRADO: Arquivos não coincidem!"
    echo ""
    echo "SOLUÇÃO:"
    echo "cd /root/primecamp-ofc"
    echo "npm run build"
    echo "sudo rm -rf /var/www/ativafix/*"
    echo "sudo cp -r dist/* /var/www/ativafix/"
    echo "sudo chown -R www-data:www-data /var/www/ativafix"
    echo "sudo systemctl restart nginx"
fi
