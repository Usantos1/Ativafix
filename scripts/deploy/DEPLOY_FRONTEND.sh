#!/bin/bash
# Deploy do frontend na VPS (Ativa FIX / PrimeCamp)
# Uso: bash scripts/deploy/DEPLOY_FRONTEND.sh
#
# Pasta publicada (deve ser a MESMA do `root` do Nginx em app.ativafix.com):
#   padrão: /var/www/ativafix   (ver docs/deploy/NGINX_ATIVAFIX_PASSO_A_PASSO.md)
#   override: FRONTEND_WEB_ROOT=/var/www/html bash scripts/deploy/DEPLOY_FRONTEND.sh

set -e

WEB_ROOT="${FRONTEND_WEB_ROOT:-/var/www/ativafix}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

if [ ! -f package.json ]; then
  echo "❌ package.json não encontrado em $REPO_ROOT"
  exit 1
fi

echo "=========================================="
echo "Deploy do Frontend"
echo "Repo:    $REPO_ROOT"
echo "Destino: $WEB_ROOT"
echo "=========================================="

echo ""
echo "1️⃣ Atualizando código do repositório..."
git pull origin main

echo ""
echo "2️⃣ Instalando dependências (se necessário)..."
npm install

echo ""
echo "3️⃣ Fazendo build do projeto..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erro: Pasta dist não foi criada!"
    exit 1
fi

echo ""
echo "3b️⃣ Gravando build-info.txt (curl deve retornar TEXTO, não index.html)..."
echo "deployed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ) commit=$(git rev-parse HEAD) branch=$(git rev-parse --abbrev-ref HEAD)" > dist/build-info.txt
cat dist/build-info.txt

echo ""
echo "4️⃣ Preparando pasta web e backup..."
sudo mkdir -p "$WEB_ROOT"
BACKUP_DIR="${WEB_ROOT}.backup"
sudo mkdir -p "$BACKUP_DIR"
sudo cp -r "${WEB_ROOT}/." "$BACKUP_DIR/" 2>/dev/null || true

echo ""
echo "5️⃣ Copiando dist → $WEB_ROOT ..."
sudo rm -rf "${WEB_ROOT:?}"/*
sudo cp -r dist/* "$WEB_ROOT/"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

echo ""
echo "6️⃣ Verificando configuração do Nginx (opcional)..."
NGINX_CONFIG="/etc/nginx/sites-available/ativafix.conf"
ALT_ATIVAFIX="/etc/nginx/sites-available/ativafix"

if [ -f "$NGINX_CONFIG" ] || [ -f "$ALT_ATIVAFIX" ]; then
  for f in "$NGINX_CONFIG" "$ALT_ATIVAFIX"; do
    [ -f "$f" ] || continue
    if ! grep -q "try_files.*index.html" "$f"; then
      echo "⚠️  $f pode precisar de try_files para SPA (revise manualmente)."
    fi
  done
else
    echo "⚠️  Nenhum arquivo em sites-available/ativafix(.conf) — ajuste o Nginx se for primeira vez."
fi

echo ""
echo "7️⃣ Testando configuração do Nginx..."
if sudo nginx -t 2>/dev/null; then
    echo "   ✅ Sintaxe OK"
    echo ""
    echo "8️⃣ Recarregando Nginx..."
    sudo systemctl reload nginx
else
    echo "   ⚠️  nginx -t falhou ou nginx não instalado — copie os arquivos e corrija o Nginx depois."
fi

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "Arquivos em $WEB_ROOT:"
ls -lah "$WEB_ROOT" | head -12

echo ""
echo "Na VPS, confira (deve ser 1 linha de texto, NÃO HTML):"
echo "  curl -s http://127.0.0.1/build-info.txt -H \"Host: app.ativafix.com\""
echo "ou, se resolver DNS na própria VPS:"
echo "  curl -s https://app.ativafix.com/build-info.txt"
