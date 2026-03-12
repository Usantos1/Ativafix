#!/bin/bash

echo "🔍 VERIFICANDO E ATUALIZANDO"
echo "============================"
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando arquivo JS gerado no build..."
BUNDLE_FILE=$(find dist/assets -name "index-*.js" -type f ! -name "*.es.js" | head -1)
BUNDLE_NAME=$(basename "$BUNDLE_FILE")
echo "   Arquivo gerado: $BUNDLE_NAME"

echo ""
echo "2️⃣ Verificando o que o dist/index.html referencia..."
grep -o 'assets/index-[^"]*\.js' dist/index.html

echo ""
echo "3️⃣ Verificando o que está no servidor web..."
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html

echo ""
echo "4️⃣ Recopiando TUDO para garantir..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

echo ""
echo "5️⃣ Verificando após cópia..."
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html

echo ""
echo "6️⃣ Removendo arquivos JS antigos..."
sudo rm -f /var/www/html/assets/index-ecSPLH9U.js
sudo rm -f /var/www/html/assets/index-B3J_Mk_8.js
sudo rm -f /var/www/html/assets/index-Bq_LBgU6.js.bak

echo ""
echo "7️⃣ Verificando arquivos JS disponíveis..."
ls -lh /var/www/html/assets/index-*.js 2>/dev/null | grep -v "\.es\.js"

echo ""
echo "8️⃣ Limpando cache e reiniciando Nginx..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl restart nginx
sleep 3

echo ""
echo "9️⃣ Testando o que está sendo servido..."
curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "✅ CONCLUÍDO!"
echo ""
echo "📋 TESTE NO NAVEGADOR:"
echo "   1. Feche TODAS as abas"
echo "   2. Abra janela anônima (Ctrl+Shift+N)"
echo "   3. Acesse: https://app.ativafix.com/integracoes"
echo "   4. Verifique se a seção 'Integração Telegram' aparece"
echo "   5. Verifique se a URL do Webhook mostra: https://app.ativafix.com/api/webhook"

