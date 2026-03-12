#!/bin/bash
set -e

echo "🔧 Resolvendo conflito e fazendo deploy..."
echo ""

cd /root/primecamp-ofc

echo "1️⃣ Descartando mudanças locais no FORCAR_DEPLOY_COMPLETO.sh..."
git checkout -- FORCAR_DEPLOY_COMPLETO.sh

echo ""
echo "2️⃣ Atualizando código..."
git pull origin main

echo ""
echo "3️⃣ Detectando diretório do Nginx..."
NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "")
if [ -z "$NGINX_ROOT" ]; then
  NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-enabled/ativafix* 2>/dev/null | grep "root" | head -1 | awk '{print $2}' | sed 's/;//' || echo "")
fi
if [ -z "$NGINX_ROOT" ]; then
  echo "  ⚠️  Não foi possível detectar, usando padrão: /var/www/ativafix"
  NGINX_ROOT="/var/www/ativafix"
fi
echo "  📁 Diretório do Nginx: $NGINX_ROOT"

if [ ! -d "$NGINX_ROOT" ]; then
  sudo mkdir -p "$NGINX_ROOT"
fi

echo ""
echo "4️⃣ Verificando se dist/ existe..."
if [ ! -d "dist" ]; then
  echo "  ⚠️  Diretório dist/ não existe. Fazendo build..."
  npm run build
else
  echo "  ✅ Diretório dist/ existe"
fi

echo ""
echo "5️⃣ Limpando diretório do Nginx..."
sudo rm -rf "$NGINX_ROOT"/*
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*

echo ""
echo "6️⃣ Copiando arquivos do dist/ para $NGINX_ROOT..."
sudo cp -r dist/* "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

echo ""
echo "7️⃣ Recarregando Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://app.ativafix.com/financeiro"
echo "💡 No navegador: Ctrl+Shift+R (hard refresh)"
