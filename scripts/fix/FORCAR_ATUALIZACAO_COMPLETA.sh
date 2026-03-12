#!/bin/bash
set -e

echo "🔥 FORÇANDO ATUALIZAÇÃO COMPLETA - LIMPAR TUDO"
echo "=============================================="
echo ""

cd /root/primecamp-ofc

echo "1️⃣ Limpando build anterior..."
rm -rf dist node_modules/.vite .vite

echo "2️⃣ Atualizando código..."
git pull origin main

echo "3️⃣ Limpando cache do npm..."
npm cache clean --force

echo "4️⃣ Reinstalando dependências..."
npm install

echo "5️⃣ Build limpo..."
npm run build

echo ""
echo "6️⃣ Verificando arquivos gerados..."
ls -lh dist/assets/ | grep "index-" | head -5

echo ""
echo "7️⃣ PARANDO Nginx..."
sudo systemctl stop nginx

echo "8️⃣ Removendo TODOS os arquivos antigos (incluindo ocultos)..."
sudo rm -rf /var/www/ativafix/*
sudo rm -rf /var/www/ativafix/.*
sudo find /var/www/ativafix -mindepth 1 -delete 2>/dev/null || true

echo "9️⃣ Copiando novos arquivos..."
sudo cp -r dist/* /var/www/ativafix/

echo "🔟 Ajustando permissões..."
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix

echo ""
echo "1️⃣1️⃣ Adicionando versionamento dinâmico ao index.html..."
TIMESTAMP=$(date +%s)
sudo sed -i "s|src=\"/assets/|src=\"/assets/?v=$TIMESTAMP|g" /var/www/ativafix/index.html
sudo sed -i "s|href=\"/assets/|href=\"/assets/?v=$TIMESTAMP|g" /var/www/ativafix/index.html
echo "   ✅ Versionamento adicionado: ?v=$TIMESTAMP"

echo ""
echo "1️⃣2️⃣ Limpando cache do Nginx COMPLETAMENTE..."
sudo rm -rf /var/cache/nginx/*
sudo find /var/cache/nginx -type f -delete 2>/dev/null || true
sudo find /var/lib/nginx/cache -type f -delete 2>/dev/null || true

echo "1️⃣3️⃣ Configurando headers anti-cache no Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/ativafix"
if [ -f "$NGINX_CONFIG" ]; then
    # Adicionar headers anti-cache se não existirem
    if ! grep -q "add_header Cache-Control.*no-cache" "$NGINX_CONFIG"; then
        echo "   Adicionando headers anti-cache..."
        sudo sed -i '/location \/ {/a\
    # Headers anti-cache para HTML/JS/CSS\
    location ~* \.(html|js|css)$ {\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\
        add_header Pragma "no-cache";\
        add_header Expires "0";\
    }' "$NGINX_CONFIG"
    fi
fi

echo "1️⃣4️⃣ Testando configuração do Nginx..."
sudo nginx -t

echo "1️⃣5️⃣ INICIANDO Nginx (restart completo)..."
sudo systemctl start nginx
sudo systemctl restart nginx

echo ""
echo "1️⃣6️⃣ Verificando status..."
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "1️⃣7️⃣ Verificando arquivos no servidor..."
echo "   Arquivo JS principal:"
ls -lh /var/www/ativafix/assets/ | grep "index-.*\.js" | grep -v "\.es\.js" | head -1

echo ""
echo "   Referência no index.html:"
grep -o 'assets/index-[^"]*\.js' /var/www/ativafix/index.html | head -1

echo ""
echo "✅ DEPLOY FORÇADO CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS NO NAVEGADOR:"
echo "   1. Abra DevTools (F12)"
echo "   2. Vá em Application → Storage → Clear storage"
echo "   3. Marque TUDO e clique em 'Clear site data'"
echo "   4. OU use modo anônimo: Ctrl+Shift+N"
echo "   5. Acesse: https://app.ativafix.com/produtos"
echo "   6. No Console, deve aparecer: '✅ Service Worker desregistrado'"
echo "   7. Verifique se 'Clonar' aparece no menu de ações"
echo ""
