#!/bin/bash

# Continuar deploy após build bem-sucedido

echo "📦 Continuando deploy após build..."
echo ""

# Copiar arquivos para Nginx
echo "1/4 Copiando arquivos para o Nginx..."
NGINX_ROOT="/var/www/ativafix"

# Limpar diretório do Nginx
sudo rm -rf "$NGINX_ROOT"/* 2>/dev/null || true
sudo rm -rf "$NGINX_ROOT"/.* 2>/dev/null || true

# Aguardar um segundo
sleep 1

# Copiar arquivos do build
sudo cp -r dist/* "$NGINX_ROOT"/

# Ajustar permissões
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
echo "✅ Arquivos copiados"
echo ""

# Recarregar Nginx
echo "2/4 Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx recarregado"
echo ""

# Reiniciar backend
echo "3/4 Reiniciando backend..."
pm2 restart all || pm2 restart primecamp-api
sleep 2
pm2 status
echo "✅ Backend reiniciado"
echo ""

# Verificar status
echo "4/4 Verificando status..."
echo ""
echo "=== Arquivos no Nginx ==="
ls -la "$NGINX_ROOT"/assets/ | head -5
echo ""
echo "=== Status PM2 ==="
pm2 list
echo ""

echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Limpe o cache do navegador (Ctrl+Shift+R ou use modo anônimo)"
echo "2. Acesse https://app.ativafix.com/admin/talent-bank"
echo "3. Verifique se os candidatos aparecem"
echo ""
