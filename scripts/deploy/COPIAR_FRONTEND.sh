#!/bin/bash

echo "📦 Copiando frontend para servidor web..."
echo "=========================================="
echo ""

cd /root/primecamp-ofc || exit 1

# Verificar se dist existe
if [ ! -d "dist" ]; then
    echo "❌ Erro: diretório dist/ não encontrado!"
    echo "   Execute: npm run build primeiro"
    exit 1
fi

# Verificar se index.html existe
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: dist/index.html não encontrado!"
    echo "   Execute: npm run build primeiro"
    exit 1
fi

echo "1️⃣ Copiando arquivos para /var/www/html/..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
echo "   ✅ Arquivos copiados"

echo ""
echo "2️⃣ Recarregando Nginx..."
sudo systemctl reload nginx
echo "   ✅ Nginx recarregado"

echo ""
echo "✅ Frontend atualizado!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)"
echo "   2. Acesse: https://app.ativafix.com/integracoes"
echo "   3. Verifique se as atualizações apareceram"

