#!/bin/bash
set -e

echo "🚀 Deploy CORRETO para o diretório do Nginx..."
echo ""

cd /root/primecamp-ofc

# Detectar diretório do Nginx
NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "")
if [ -z "$NGINX_ROOT" ]; then
  NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-enabled/ativafix* 2>/dev/null | grep "root" | head -1 | awk '{print $2}' | sed 's/;//' || echo "")
fi
if [ -z "$NGINX_ROOT" ]; then
  NGINX_ROOT="/var/www/ativafix"
fi

echo "📁 Diretório do Nginx: $NGINX_ROOT"

if [ ! -d "$NGINX_ROOT" ]; then
  sudo mkdir -p "$NGINX_ROOT"
fi

echo ""
echo "🗑️  Limpando diretório do Nginx..."
sudo rm -rf "$NGINX_ROOT"/*
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*

echo ""
echo "📤 Copiando arquivos do dist/ para $NGINX_ROOT..."
sudo cp -r dist/* "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

echo ""
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Deploy concluído no diretório correto!"
echo "🌐 Acesse: https://app.ativafix.com/financeiro"
echo "💡 No navegador: Ctrl+Shift+R (hard refresh)"
