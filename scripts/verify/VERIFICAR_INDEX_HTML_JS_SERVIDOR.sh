#!/bin/bash

echo "🔍 VERIFICANDO INDEX.HTML E ARQUIVO JS NO SERVIDOR"
echo "==================================================="
echo ""

# Detectar diretório do Nginx automaticamente
NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "")
if [ -z "$NGINX_ROOT" ]; then
    NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-enabled/ativafix* 2>/dev/null | grep "root" | head -1 | awk '{print $2}' | sed 's/;//' || echo "")
fi
if [ -z "$NGINX_ROOT" ]; then
    NGINX_ROOT="/var/www/ativafix"
fi

echo "📁 Diretório root do Nginx: $NGINX_ROOT"
echo ""

echo "1️⃣ Verificando qual JS o index.html referencia..."
echo ""
cat "$NGINX_ROOT/index.html" | grep -o 'assets/index-[^"]*\.js' | head -1
echo ""

echo "2️⃣ Listando TODOS os arquivos JS em assets/..."
echo ""
ls -lh "$NGINX_ROOT/assets/"index-*.js 2>/dev/null | awk '{print $9, "(" $5 ")"}'
echo ""

echo "3️⃣ Verificando se o arquivo referenciado existe..."
REFERENCED_JS=$(cat "$NGINX_ROOT/index.html" | grep -o 'assets/index-[^"]*\.js' | head -1 | sed 's|assets/||')
if [ -f "$NGINX_ROOT/assets/$REFERENCED_JS" ]; then
    echo "   ✅ Arquivo referenciado EXISTE: $REFERENCED_JS"
    ls -lh "$NGINX_ROOT/assets/$REFERENCED_JS"
else
    echo "   ❌ Arquivo referenciado NÃO EXISTE: $REFERENCED_JS"
    echo "   Isso explica o problema!"
fi
echo ""

echo "4️⃣ Verificando timestamp do index.html..."
ls -lh "$NGINX_ROOT/index.html" | awk '{print "   Timestamp:", $6, $7, $8}'
echo ""

echo "5️⃣ Verificando conteúdo completo da tag script no index.html..."
echo ""
grep -A 2 -B 2 'script.*type.*module' "$NGINX_ROOT/index.html" | head -5
echo ""

echo "6️⃣ Fazendo requisição HTTP real para ver o que o servidor retorna..."
echo ""
curl -s https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | head -1
echo ""
