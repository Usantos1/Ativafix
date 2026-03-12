#!/bin/bash

# ============================================
# DEPLOY: Fix AnaliseVendedores + Scrollbar
# ============================================

set -e

echo "🚀 Iniciando deploy do fix AnaliseVendedores..."

# Detectar diretório nginx
NGINX_ROOT=$(grep -r "root " /etc/nginx/sites-enabled/*.conf 2>/dev/null | grep -v "#" | head -1 | awk '{print $2}' | sed 's/;$//' | sed 's/;.*$//')
if [ -z "$NGINX_ROOT" ]; then
    # Tentar padrões comuns
    if [ -d "/var/www/ativafix" ]; then
        NGINX_ROOT="/var/www/ativafix"
    elif [ -d "/var/www/html" ]; then
        NGINX_ROOT="/var/www/html"
    else
        echo "❌ Não foi possível detectar diretório Nginx"
        exit 1
    fi
fi

echo "📁 Diretório Nginx detectado: $NGINX_ROOT"

# 1. Atualizar código
echo "📥 Atualizando código do repositório..."
cd /root/primecamp-ofc
git pull origin main

# 2. Build frontend
echo "🔨 Fazendo build do frontend..."
npm run build

# 3. Deploy frontend
echo "📤 Fazendo deploy do frontend..."
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r dist/* "$NGINX_ROOT"/
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

# 4. Limpar cache
echo "🧹 Limpando cache..."
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*
sudo systemctl reload nginx

# 5. Reiniciar backend (se necessário)
echo "🔄 Reiniciando backend..."
cd /root/primecamp-ofc/server
pm2 restart primecamp-api || echo "⚠️ PM2 não reiniciado (pode não estar rodando)"

echo "✅ Deploy concluído!"
echo "📍 Frontend: $NGINX_ROOT"
echo "🔗 Teste: https://app.ativafix.com/financeiro/analise-vendedores"
echo ""
echo "💡 Se ainda houver erro, faça hard refresh no navegador: Ctrl+Shift+R"
