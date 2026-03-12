#!/bin/bash

echo "🔍 VERIFICANDO QUAL ARQUIVO JS O INDEX.HTML ESTÁ USANDO"
echo "======================================================="
echo ""

NGINX_ROOT="/var/www/ativafix"

echo "1️⃣ Verificando qual arquivo JS o index.html referencia..."
JS_REFERENCED=$(grep -o 'assets/index-[^"]*\.js' "$NGINX_ROOT/index.html" | head -1 | sed 's|assets/||')
echo "   Arquivo JS referenciado: $JS_REFERENCED"
echo ""

echo "2️⃣ Verificando se esse arquivo existe..."
if [ -f "$NGINX_ROOT/assets/$JS_REFERENCED" ]; then
    echo "   ✅ Arquivo existe: $NGINX_ROOT/assets/$JS_REFERENCED"
    FILE_SIZE=$(du -h "$NGINX_ROOT/assets/$JS_REFERENCED" | cut -f1)
    echo "   Tamanho: $FILE_SIZE"
else
    echo "   ❌ Arquivo NÃO existe!"
    echo "   Arquivos JS disponíveis:"
    ls -lh "$NGINX_ROOT/assets/index-"*.js 2>/dev/null | head -5
    exit 1
fi
echo ""

echo "3️⃣ Verificando se a rota está neste arquivo específico..."
if grep -q "configuracoes/pagamentos" "$NGINX_ROOT/assets/$JS_REFERENCED"; then
    echo "   ✅ Rota encontrada no arquivo referenciado!"
    grep -o "configuracoes/pagamentos" "$NGINX_ROOT/assets/$JS_REFERENCED" | head -1
else
    echo "   ❌ Rota NÃO encontrada no arquivo referenciado!"
    echo ""
    echo "   Procurando em outros arquivos JS..."
    FOUND_IN=$(grep -l "configuracoes/pagamentos" "$NGINX_ROOT/assets/"*.js 2>/dev/null | head -1)
    if [ -n "$FOUND_IN" ]; then
        FOUND_FILE=$(basename "$FOUND_IN")
        echo "   ⚠️ Rota encontrada em: $FOUND_FILE"
        echo "   ⚠️ Mas index.html referencia: $JS_REFERENCED"
        echo "   ⚠️ Há um mismatch - index.html está referenciando arquivo errado!"
    else
        echo "   ❌ Rota não encontrada em nenhum arquivo JS!"
    fi
fi
echo ""

echo "4️⃣ Verificando timestamp do index.html..."
INDEX_TIME=$(stat -c %Y "$NGINX_ROOT/index.html" 2>/dev/null || stat -f %m "$NGINX_ROOT/index.html" 2>/dev/null)
JS_TIME=$(stat -c %Y "$NGINX_ROOT/assets/$JS_REFERENCED" 2>/dev/null || stat -f %m "$NGINX_ROOT/assets/$JS_REFERENCED" 2>/dev/null)

if [ "$JS_TIME" -gt "$INDEX_TIME" ]; then
    echo "   ⚠️ Arquivo JS é mais novo que index.html"
    echo "   ⚠️ Pode ser que index.html esteja desatualizado"
elif [ "$INDEX_TIME" -gt "$JS_TIME" ]; then
    echo "   ⚠️ index.html é mais novo que arquivo JS"
    echo "   ⚠️ Pode ser que arquivo JS esteja desatualizado"
else
    echo "   ✅ Timestamps estão próximos (dentro de 1 segundo)"
fi
echo ""

echo "5️⃣ Listando TODOS os arquivos JS disponíveis..."
echo "   Arquivos JS em assets/:"
ls -lht "$NGINX_ROOT/assets/index-"*.js 2>/dev/null | head -5 | awk '{print $9, "(" $5 ")"}'
echo ""

echo "📋 RESUMO:"
echo "   Se há mismatch entre arquivo referenciado e arquivo com a rota → Precisa rebuild"
echo "   Se o arquivo referenciado não tem a rota → Precisa rebuild"
echo "   Se tudo está correto mas não funciona → Pode ser cache do navegador/Service Worker"
