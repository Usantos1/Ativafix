#!/bin/bash

echo "🔥 RESOLVENDO CACHE DEFINITIVAMENTE"
echo "==================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando configurações do Nginx..."
NGINX_CONFIGS=$(find /etc/nginx -name "*.conf" -o -name "*primecamp*" 2>/dev/null | grep -v "default.d")
echo "   Configurações encontradas:"
echo "$NGINX_CONFIGS"

echo ""
echo "2️⃣ Verificando qual configuração está ativa..."
sudo nginx -T 2>/dev/null | grep -A 5 "server_name.*primecamp\|root.*html" | head -20

echo ""
echo "3️⃣ Verificando se há proxy/CDN na frente..."
curl -I https://app.ativafix.com/ 2>&1 | grep -i "server:\|cf-\|cloudflare\|x-cache\|via:"

echo ""
echo "4️⃣ Garantindo que index.html está correto localmente..."
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html

echo ""
echo "5️⃣ Testando via localhost (sem proxy)..."
curl -s http://localhost/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "6️⃣ Adicionando headers anti-cache em TODAS as configurações do Nginx..."
for config in $NGINX_CONFIGS; do
    if [ -f "$config" ]; then
        echo "   Processando: $config"
        
        # Fazer backup
        sudo cp "$config" "${config}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Adicionar headers anti-cache para index.html se não existir
        if ! grep -q "location = /index.html" "$config"; then
            sudo sed -i '/location \/ {/a\
\
    # Anti-cache para index.html\
    location = /index.html {\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\
        add_header Pragma "no-cache";\
        add_header Expires "0";\
        add_header X-Content-Type-Options "nosniff";\
    }
' "$config"
        fi
        
        # Adicionar headers anti-cache para todos os arquivos HTML
        if ! grep -q "add_header.*no-cache.*location /" "$config"; then
            sudo sed -i '/location \/ {/a\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\
        add_header Pragma "no-cache";\
        add_header Expires "0";
' "$config"
        fi
    fi
done

echo ""
echo "7️⃣ Verificando sintaxe do Nginx..."
if sudo nginx -t; then
    echo "   ✅ Sintaxe OK"
    sudo systemctl restart nginx
    sleep 3
else
    echo "   ❌ Erro de sintaxe!"
    exit 1
fi

echo ""
echo "8️⃣ Testando novamente..."
echo "   Via localhost:"
curl -s http://localhost/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "   Via HTTPS (pode ter CDN):"
curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "✅ CONCLUÍDO!"
echo ""
echo "⚠️ Se ainda mostrar arquivo antigo via HTTPS, há um CDN/proxy na frente."
echo "   Nesse caso, você precisa:"
echo "   1. Limpar cache no painel do Cloudflare (se usar)"
echo "   2. OU aguardar alguns minutos para o cache expirar"
echo "   3. OU adicionar um parâmetro de versão: https://app.ativafix.com/integracoes?v=$(date +%s)"

