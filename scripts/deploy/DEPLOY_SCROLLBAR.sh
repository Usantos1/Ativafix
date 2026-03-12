#!/bin/bash
set -e

echo "🚀 Deploy do scrollbar melhorado..."
echo ""

cd /root/primecamp-ofc

echo "1️⃣ Atualizando código..."
git pull origin main

echo ""
echo "2️⃣ Fazendo build..."
npm run build

echo ""
echo "3️⃣ Detectando diretório do Nginx..."
NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "/var/www/ativafix")

echo ""
echo "4️⃣ Deploy para $NGINX_ROOT..."
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r dist/* "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*
sudo systemctl reload nginx

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://app.ativafix.com/financeiro"
echo "💡 No navegador: Ctrl+Shift+R (hard refresh)"
