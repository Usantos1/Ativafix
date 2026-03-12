#!/bin/bash

echo "🔧 ADICIONANDO HEADERS NO-CACHE PARA ARQUIVOS JS NO NGINX"
echo "========================================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-enabled/ativafix.conf"

echo "1️⃣ Fazendo backup da configuração..."
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup criado"
echo ""

echo "2️⃣ Verificando configuração atual..."
if grep -q "location ~\* \\.(js|css)\$" "$NGINX_CONFIG"; then
    echo "   ✅ Já existe location para arquivos JS/CSS"
    grep -A 5 "location ~\* \\.(js|css)\$" "$NGINX_CONFIG"
else
    echo "   ⚠️ Não encontrou location específico para JS/CSS"
    echo "   Adicionando configuração..."
    
    # Adicionar antes do último }
    sudo sed -i '/^}$/i\
    # Arquivos JS e CSS sem cache (forçar sempre buscar versão mais recente)\
    location ~* \.(js|css)$ {\
        expires -1;\
        add_header Cache-Control "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0";\
        add_header Pragma "no-cache";\
        add_header Expires "0";\
        access_log off;\
    }\
' "$NGINX_CONFIG"
    
    echo "   ✅ Configuração adicionada"
fi
echo ""

echo "3️⃣ Verificando se location para index.html tem headers corretos..."
if grep -A 10 "location = /index.html" "$NGINX_CONFIG" | grep -q "Cache-Control.*no-cache"; then
    echo "   ✅ index.html já tem headers no-cache"
else
    echo "   ⚠️ index.html pode não ter headers corretos"
fi
echo ""

echo "4️⃣ Testando sintaxe do Nginx..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Sintaxe OK"
else
    echo "   ❌ Erro de sintaxe!"
    sudo nginx -t
    echo ""
    echo "   Restaurando backup..."
    sudo cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null || true
    exit 1
fi
echo ""

echo "5️⃣ Recarregando Nginx..."
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "   ✅ Nginx recarregado"
else
    echo "   ❌ Erro ao recarregar Nginx"
    exit 1
fi
echo ""

echo "✅ CONFIGURAÇÃO APLICADA!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. No navegador, abra DevTools (F12)"
echo "   2. Vá em Application (Chrome) ou Storage (Firefox)"
echo "   3. Service Workers: Desregistre qualquer Service Worker"
echo "   4. Cache Storage: Limpe tudo"
echo "   5. Feche TODAS as abas do site"
echo "   6. Limpe cache: Ctrl+Shift+Delete → Todo o período → Imagens e arquivos em cache"
echo "   7. OU use modo anônimo (Ctrl+Shift+N)"
echo "   8. Acesse: https://app.ativafix.com/admin/configuracoes/pagamentos"
