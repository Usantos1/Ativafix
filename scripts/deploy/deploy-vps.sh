#!/usr/bin/env bash
# Deploy AtivaFIX/Primecamp na VPS (frontend + API)
#
# Uso na VPS:
#   bash /root/primecamp-ofc/scripts/deploy/deploy-vps.sh
#
# Variáveis opcionais:
#   PROJECT_DIR=/root/primecamp-ofc
#   NGINX_ROOT=/var/www/ativafix
#   PM2_APP=primecamp-api
#   REMOTE=origin
#   BRANCH=main

set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/primecamp-ofc}"
NGINX_ROOT="${NGINX_ROOT:-/var/www/ativafix}"
PM2_APP="${PM2_APP:-primecamp-api}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"

log() {
  printf '\n>>> %s\n' "$1"
}

fail() {
  printf '\nERRO: %s\n' "$1" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || fail "git nao encontrado"
command -v npm >/dev/null 2>&1 || fail "npm nao encontrado"
command -v pm2 >/dev/null 2>&1 || fail "pm2 nao encontrado"

[ -d "$PROJECT_DIR/.git" ] || fail "Projeto nao encontrado em $PROJECT_DIR. Confira o caminho ou rode: git clone https://github.com/Usantos1/Ativafix.git $PROJECT_DIR"

cd "$PROJECT_DIR"

log "Atualizando codigo em $PROJECT_DIR"
git fetch "$REMOTE" "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only "$REMOTE" "$BRANCH"
git log -1 --oneline

log "Instalando dependencias do frontend"
npm install

log "Gerando build do frontend"
rm -rf dist
npm run build
[ -f "dist/index.html" ] || fail "Build nao gerou dist/index.html"

log "Publicando frontend em $NGINX_ROOT"
sudo mkdir -p "$NGINX_ROOT"
sudo find "$NGINX_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -r dist/. "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

log "Limpando cache e recarregando Nginx"
sudo rm -rf /var/cache/nginx/* /var/lib/nginx/cache/* 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx

log "Instalando dependencias da API"
cd "$PROJECT_DIR/server"
npm install --production

log "Reiniciando API no PM2 ($PM2_APP)"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP" --update-env
else
  pm2 start index.js --name "$PM2_APP"
fi
pm2 save

log "Verificacao rapida"
pm2 status "$PM2_APP"
printf '\nFrontend: %s\nAPI: %s\nCommit: %s\n' "$NGINX_ROOT" "$PM2_APP" "$(git -C "$PROJECT_DIR" log -1 --oneline)"
printf '\nDeploy concluido!\n'
