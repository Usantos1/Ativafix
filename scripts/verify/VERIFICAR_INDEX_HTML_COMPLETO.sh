#!/bin/bash

echo "🔍 VERIFICANDO INDEX.HTML COMPLETO NO SERVIDOR"
echo "=============================================="
echo ""

NGINX_ROOT="/var/www/ativafix"

echo "1️⃣ Verificando qual arquivo JS o index.html referencia..."
JS_REF=$(grep -o 'assets/index-[^"]*\.js' "$NGINX_ROOT/index.html" | head -1)
echo "   Arquivo referenciado: $JS_REF"
echo ""

echo "2️⃣ Verificando se há MÚLTIPLAS referências a arquivos JS..."
JS_COUNT=$(grep -o 'assets/index-[^"]*\.js' "$NGINX_ROOT/index.html" | wc -l)
echo "   Total de referências a index-*.js: $JS_COUNT"

if [ "$JS_COUNT" -gt 1 ]; then
    echo "   ⚠️ Há múltiplas referências! Isso pode causar problemas"
    grep -n 'assets/index-[^"]*\.js' "$NGINX_ROOT/index.html"
else
    echo "   ✅ Apenas uma referência (correto)"
fi
echo ""

echo "3️⃣ Verificando se há referência ao arquivo antigo (Bebdfp69)..."
if grep -q "Bebdfp69" "$NGINX_ROOT/index.html"; then
    echo "   ❌ ENCONTRADO referência ao arquivo antigo!"
    grep -n "Bebdfp69" "$NGINX_ROOT/index.html"
    echo "   ⚠️ Isso é o problema - index.html referencia arquivo antigo"
else
    echo "   ✅ Não há referência ao arquivo antigo"
fi
echo ""

echo "4️⃣ Comparando com o index.html do build (dist/)..."
if [ -f "dist/index.html" ]; then
    DIST_JS_REF=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1)
    echo "   Arquivo referenciado no dist/: $DIST_JS_REF"
    
    if [ "$JS_REF" != "$DIST_JS_REF" ]; then
        echo "   ⚠️ DIFERENÇA encontrada!"
        echo "   Servidor: $JS_REF"
        echo "   Dist:     $DIST_JS_REF"
        echo "   ⚠️ Os arquivos estão desincronizados"
    else
        echo "   ✅ Arquivos estão sincronizados"
    fi
else
    echo "   ⚠️ dist/index.html não existe - precisa fazer build primeiro"
fi
echo ""

echo "5️⃣ Exibindo últimas linhas do index.html (onde está a referência JS)..."
echo "   Últimas 10 linhas do index.html no servidor:"
tail -10 "$NGINX_ROOT/index.html"
echo ""

echo "📋 RESUMO:"
echo "   Se há referência ao arquivo antigo → Precisa rebuild e copiar novamente"
echo "   Se há múltiplas referências → Precisa verificar o build"
echo "   Se está tudo correto mas não funciona → Cache muito persistente do navegador"
