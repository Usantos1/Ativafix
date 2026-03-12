#!/bin/bash

echo "🔍 DIAGNOSTICANDO CARD FORMAS DE PAGAMENTO"
echo "=========================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando código fonte (Configuracoes.tsx)..."
if grep -q "Formas de Pagamento e Taxas" src/pages/admin/Configuracoes.tsx; then
    echo "   ✅ Card encontrado no código fonte"
    grep -A 5 "Formas de Pagamento e Taxas" src/pages/admin/Configuracoes.tsx | head -8
else
    echo "   ❌ Card NÃO encontrado no código fonte!"
    exit 1
fi
echo ""

echo "2️⃣ Verificando permissão no código..."
if grep -q "permission: 'admin.view'" src/pages/admin/Configuracoes.tsx; then
    echo "   ✅ Permissão 'admin.view' encontrada"
else
    echo "   ⚠️ Permissão 'admin.view' NÃO encontrada, verificando..."
    grep -B 2 -A 2 "Formas de Pagamento" src/pages/admin/Configuracoes.tsx | grep permission
fi
echo ""

echo "3️⃣ Verificando se dist/ existe e tem arquivos..."
if [ -d "dist" ]; then
    echo "   ✅ Diretório dist/ existe"
    FILE_COUNT=$(find dist -type f | wc -l)
    echo "   📁 Total de arquivos: $FILE_COUNT"
    
    if [ -f "dist/index.html" ]; then
        echo "   ✅ index.html existe"
    else
        echo "   ❌ index.html NÃO existe!"
    fi
else
    echo "   ❌ Diretório dist/ não existe! Precisa fazer build primeiro."
    exit 1
fi
echo ""

echo "4️⃣ Procurando 'Formas de Pagamento' no build..."
if grep -r "Formas de Pagamento" dist/ 2>/dev/null | head -1 > /dev/null; then
    echo "   ✅ 'Formas de Pagamento' encontrado no build"
    grep -r "Formas de Pagamento" dist/ 2>/dev/null | head -2
else
    echo "   ❌ 'Formas de Pagamento' NÃO encontrado no build!"
    echo "   ⚠️ Isso significa que o código não foi incluído no build"
fi
echo ""

echo "5️⃣ Verificando arquivos no servidor web..."
NGINX_ROOT="/var/www/ativafix"
if [ -f "$NGINX_ROOT/index.html" ]; then
    echo "   ✅ index.html existe no servidor"
    
    # Verificar se tem referência ao build atual
    if grep -q "assets/index-" "$NGINX_ROOT/index.html"; then
        echo "   ✅ index.html tem referência a assets/"
        grep -o 'assets/index-[^"]*\.js' "$NGINX_ROOT/index.html" | head -1
    else
        echo "   ⚠️ index.html não tem referência a assets/"
    fi
    
    # Verificar se 'Formas de Pagamento' está nos arquivos JS do servidor
    if grep -r "Formas de Pagamento" "$NGINX_ROOT" 2>/dev/null | head -1 > /dev/null; then
        echo "   ✅ 'Formas de Pagamento' encontrado nos arquivos do servidor"
        grep -r "Formas de Pagamento" "$NGINX_ROOT" 2>/dev/null | head -1 | cut -c1-100
    else
        echo "   ❌ 'Formas de Pagamento' NÃO encontrado nos arquivos do servidor!"
        echo "   ⚠️ Os arquivos do servidor estão desatualizados"
    fi
else
    echo "   ❌ index.html NÃO existe no servidor!"
fi
echo ""

echo "6️⃣ Verificando timestamp dos arquivos..."
if [ -f "dist/index.html" ] && [ -f "$NGINX_ROOT/index.html" ]; then
    DIST_TIME=$(stat -c %Y dist/index.html 2>/dev/null || stat -f %m dist/index.html 2>/dev/null)
    NGINX_TIME=$(stat -c %Y "$NGINX_ROOT/index.html" 2>/dev/null || stat -f %m "$NGINX_ROOT/index.html" 2>/dev/null)
    
    if [ "$DIST_TIME" -gt "$NGINX_TIME" ]; then
        echo "   ⚠️ dist/index.html é mais novo que o do servidor"
        echo "   💡 Precisa copiar arquivos novamente"
    else
        echo "   ✅ Arquivos estão sincronizados"
    fi
fi
echo ""

echo "7️⃣ Verificando configuração do Nginx..."
NGINX_CONFIG=$(find /etc/nginx -name "*primecamp*" -o -name "default" 2>/dev/null | head -1)
if [ -n "$NGINX_CONFIG" ]; then
    echo "   📄 Configuração: $NGINX_CONFIG"
    if grep -q "location = /index.html" "$NGINX_CONFIG"; then
        echo "   ✅ Nginx tem location específico para index.html"
    fi
    if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
        echo "   ✅ Nginx está configurado para SPA (try_files index.html)"
    fi
else
    echo "   ⚠️ Configuração do Nginx não encontrada"
fi
echo ""

echo "📋 RESUMO:"
echo "   Se 'Formas de Pagamento' não está no build → Precisa rebuild"
echo "   Se está no build mas não no servidor → Precisa copiar"
echo "   Se está no servidor mas não aparece → Pode ser cache do navegador"
echo ""
