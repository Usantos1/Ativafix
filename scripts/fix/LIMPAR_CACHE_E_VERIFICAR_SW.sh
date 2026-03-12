#!/bin/bash

echo "🧹 VERIFICANDO SERVICE WORKER E CACHE"
echo "======================================"
echo ""

NGINX_ROOT="/var/www/ativafix"

echo "1️⃣ Verificando se há Service Worker registrado..."
if [ -f "$NGINX_ROOT/service-worker.js" ] || [ -f "$NGINX_ROOT/sw.js" ]; then
    echo "   ⚠️ Service Worker encontrado!"
    ls -lh "$NGINX_ROOT"/service-worker.js "$NGINX_ROOT"/sw.js 2>/dev/null
    echo "   ⚠️ Service Worker pode estar cacheando a aplicação"
else
    echo "   ✅ Nenhum Service Worker encontrado"
fi
echo ""

echo "2️⃣ Verificando se há manifest.json (PWA)..."
if [ -f "$NGINX_ROOT/manifest.json" ]; then
    echo "   ⚠️ manifest.json encontrado - aplicação pode ser PWA"
    grep -i "service.*worker\|sw\.js" "$NGINX_ROOT/manifest.json" 2>/dev/null || echo "   (não referencia service worker)"
else
    echo "   ✅ Nenhum manifest.json encontrado"
fi
echo ""

echo "3️⃣ Verificando index.html por registros de Service Worker..."
if grep -qi "service.*worker\|navigator\.serviceWorker\|registerServiceWorker" "$NGINX_ROOT/index.html" 2>/dev/null; then
    echo "   ⚠️ Service Worker pode estar sendo registrado no index.html"
    grep -i "service.*worker\|navigator\.serviceWorker\|registerServiceWorker" "$NGINX_ROOT/index.html" 2>/dev/null | head -3
else
    echo "   ✅ Nenhuma referência a Service Worker no index.html"
fi
echo ""

echo "4️⃣ Verificando headers do Nginx para cache..."
NGINX_CONFIG="/etc/nginx/sites-enabled/ativafix.conf"
if grep -A 10 "location = /index.html" "$NGINX_CONFIG" 2>/dev/null | grep -q "Cache-Control.*no-cache"; then
    echo "   ✅ Headers anti-cache configurados para index.html"
else
    echo "   ⚠️ Headers anti-cache podem não estar configurados corretamente"
fi
echo ""

echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "Se há Service Worker:"
echo "  1. Os usuários precisam desregistrar o Service Worker manualmente"
echo "  2. Ou adicionar código para desregistrar na próxima versão"
echo ""
echo "Se não há Service Worker:"
echo "  1. O problema é cache do navegador muito persistente"
echo "  2. Usuários devem:"
echo "     - Fechar TODAS as abas do site"
echo "     - Limpar cache completamente (Ctrl+Shift+Delete)"
echo "     - Ou usar modo anônimo/privado"
echo ""
echo "Para forçar atualização, pode tentar adicionar query string:"
echo "  https://app.ativafix.com/admin/configuracoes/pagamentos?v=$(date +%s)"
