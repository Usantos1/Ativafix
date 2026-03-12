#!/bin/bash
set -e

echo "🚀 Deploy FORÇADO do Frontend para Produção (Rebuild Completo)"
echo ""

cd /root/primecamp-ofc || { echo "Erro: Diretório /root/primecamp-ofc não encontrado."; exit 1; }

echo "1️⃣ Atualizando código do repositório..."
git pull origin main
echo "✅ Código atualizado."

echo ""
echo "2️⃣ Limpando TODOS os caches e builds anteriores..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf .vite
rm -rf .vite-build
echo "✅ Caches limpos."

echo ""
echo "3️⃣ Fazendo build completo do frontend (sem cache)..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build!"
    exit 1
fi
echo "✅ Build concluído."

# Detectar diretório do Nginx
echo ""
echo "4️⃣ Detectando diretório do Nginx..."
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
echo "5️⃣ Limpando diretório do Nginx (backup do index.html atual)..."
sudo cp "$NGINX_ROOT/index.html" "$NGINX_ROOT/index.html.backup" 2>/dev/null || true
sudo rm -rf "$NGINX_ROOT"/*
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*
echo "✅ Diretório do Nginx limpo."

echo ""
echo "6️⃣ Copiando arquivos do dist/ para $NGINX_ROOT..."
sudo cp -r dist/* "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
echo "✅ Arquivos copiados."

echo ""
echo "7️⃣ Verificando se showAlreadyAppliedModal está no build..."
if grep -r "showAlreadyAppliedModal" "$NGINX_ROOT/assets"/*.js > /dev/null 2>&1; then
  echo "✅ showAlreadyAppliedModal encontrado no build!"
else
  echo "⚠️ ATENÇÃO: showAlreadyAppliedModal NÃO encontrado no build!"
  echo "   Isso pode indicar um problema no código fonte."
fi

echo ""
echo "8️⃣ Recarregando Nginx..."
sudo systemctl stop nginx
sleep 1
sudo systemctl start nginx
sleep 1
sudo systemctl reload nginx
echo "✅ Nginx recarregado."

echo ""
echo "✅ Deploy FORÇADO concluído!"
echo "🌐 Acesse: https://app.ativafix.com/vaga/Aux-tecnico"
echo "💡 IMPORTANTE: Use modo anônimo (Ctrl+Shift+N) e limpe o cache do navegador!"
echo "   Ou pressione Ctrl+Shift+R para hard refresh"
