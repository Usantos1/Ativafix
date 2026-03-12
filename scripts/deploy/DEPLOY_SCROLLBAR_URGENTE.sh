#!/bin/bash

# ============================================
# DEPLOY URGENTE: Fix Scrollbar
# ============================================

set -e

echo "🚀 DEPLOY URGENTE - Fix Scrollbar..."

# Detectar diretório nginx (com fallbacks seguros)
NGINX_ROOT=""
if [ -d "/var/www/ativafix" ]; then
    NGINX_ROOT="/var/www/ativafix"
elif [ -d "/var/www/html" ]; then
    NGINX_ROOT="/var/www/html"
else
    # Tentar detectar do nginx config
    if [ -f /etc/nginx/sites-enabled/default ]; then
        NGINX_ROOT=$(grep -E "^\s*root\s+" /etc/nginx/sites-enabled/default 2>/dev/null | head -1 | awk '{print $2}' | sed 's/;$//' | sed 's/;.*$//' | tr -d ';')
    fi
    if [ -z "$NGINX_ROOT" ] || [ ! -d "$NGINX_ROOT" ]; then
        echo "❌ Não foi possível detectar diretório Nginx válido"
        exit 1
    fi
fi

# Validar que o diretório existe e é seguro (não é raiz)
if [ -z "$NGINX_ROOT" ] || [ "$NGINX_ROOT" = "/" ] || [ "$NGINX_ROOT" = "" ]; then
    echo "❌ Diretório Nginx inválido: $NGINX_ROOT"
    exit 1
fi

if [ ! -d "$NGINX_ROOT" ]; then
    echo "❌ Diretório não existe: $NGINX_ROOT"
    exit 1
fi

echo "📁 Diretório Nginx: $NGINX_ROOT"

# Verificar se estamos no diretório correto
if [ ! -d "/root/primecamp-ofc" ]; then
    echo "❌ Diretório /root/primecamp-ofc não encontrado"
    exit 1
fi

# 1. Atualizar código
echo "📥 Atualizando código..."
cd /root/primecamp-ofc || exit 1
git pull origin main

# 2. Build frontend
echo "🔨 Fazendo build do frontend..."
npm run build

# 3. Verificar se dist existe
if [ ! -d "dist" ]; then
    echo "❌ Diretório dist não encontrado após build"
    exit 1
fi

# 4. Deploy frontend (usar comandos sem sudo se já for root)
echo "📤 Fazendo deploy..."
if [ "$(id -u)" -eq 0 ]; then
    # Já é root, não precisa sudo
    rm -rf "$NGINX_ROOT"/* 2>/dev/null || true
    cp -r dist/* "$NGINX_ROOT"/
    chown -R www-data:www-data "$NGINX_ROOT" 2>/dev/null || chown -R root:root "$NGINX_ROOT"
    chmod -R 755 "$NGINX_ROOT"
else
    # Precisa sudo
    sudo rm -rf "$NGINX_ROOT"/* 2>/dev/null || true
    sudo cp -r dist/* "$NGINX_ROOT"/
    sudo chown -R www-data:www-data "$NGINX_ROOT"
    sudo chmod -R 755 "$NGINX_ROOT"
fi

# 5. Limpar cache do nginx (só se nginx estiver instalado)
echo "🧹 Limpando cache do nginx..."
if command -v systemctl >/dev/null 2>&1; then
    if [ "$(id -u)" -eq 0 ]; then
        rm -rf /var/cache/nginx/* 2>/dev/null || true
        rm -rf /var/lib/nginx/cache/* 2>/dev/null || true
        systemctl reload nginx 2>/dev/null || true
    else
        sudo rm -rf /var/cache/nginx/* 2>/dev/null || true
        sudo rm -rf /var/lib/nginx/cache/* 2>/dev/null || true
        sudo systemctl reload nginx 2>/dev/null || true
    fi
fi

echo "✅ Deploy concluído!"
echo ""
echo "💡 IMPORTANTE: Faça hard refresh no navegador:"
echo "   - Windows/Linux: Ctrl+Shift+R ou Ctrl+F5"
echo "   - Mac: Cmd+Shift+R"
echo "   - Ou abra em aba anônima/privada"
echo ""
echo "📍 Teste: https://app.ativafix.com/financeiro/transacoes"
