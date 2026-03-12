#!/bin/bash

echo "🌐 RESOLVENDO CACHE DE CDN/PROXY"
echo "================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando se há Cloudflare ou CDN..."
curl -I https://app.ativafix.com/ 2>&1 | grep -i "cloudflare\|cf-\|server:"

echo ""
echo "2️⃣ Adicionando headers anti-cache no Nginx para index.html..."
NGINX_CONFIG="/etc/nginx/sites-available/default"
if [ ! -f "$NGINX_CONFIG" ]; then
    NGINX_CONFIG=$(find /etc/nginx -name "*.conf" -o -name "*primecamp*" 2>/dev/null | grep -v "default.d" | head -1)
fi

if [ -f "$NGINX_CONFIG" ]; then
    # Fazer backup
    sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Adicionar location específico para index.html com headers anti-cache
    if ! grep -q "location = /index.html" "$NGINX_CONFIG"; then
        echo "   Adicionando location específico para index.html..."
        sudo sed -i '/location \/ {/a\
\
    # Anti-cache para index.html\
    location = /index.html {\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\
        add_header Pragma "no-cache";\
        add_header Expires "0";\
    }
' "$NGINX_CONFIG"
    fi
    
    # Verificar sintaxe
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "   ✅ Nginx atualizado com headers anti-cache"
    else
        echo "   ⚠️ Erro de sintaxe"
        sudo cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null
    fi
fi

echo ""
echo "3️⃣ Garantindo que index.html está correto..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

# Remover qualquer referência antiga
sudo sed -i '/index-ecSPLH9U.js/d' /var/www/html/index.html

echo ""
echo "4️⃣ Verificando arquivo local..."
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html

echo ""
echo "5️⃣ Limpando TODOS os caches..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
sleep 3

echo ""
echo "6️⃣ Testando via localhost (sem CDN)..."
curl -s http://localhost/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "7️⃣ Testando via HTTPS (pode ter CDN)..."
curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "8️⃣ Se ainda mostrar arquivo antigo, pode ser CDN (Cloudflare)..."
echo "   Nesse caso, você precisa limpar o cache no painel do Cloudflare"
echo "   ou aguardar alguns minutos para o cache expirar."

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📋 TESTE NO NAVEGADOR:"
echo "   1. Feche TODAS as abas"
echo "   2. Abra janela anônima (Ctrl+Shift+N)"
echo "   3. Acesse: https://app.ativafix.com/integracoes"
echo "   4. Verifique no Network tab qual arquivo está sendo carregado"

