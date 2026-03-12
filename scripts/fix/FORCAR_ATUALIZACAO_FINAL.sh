#!/bin/bash

echo "🔥 FORÇANDO ATUALIZAÇÃO FINAL"
echo "============================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Fazendo rebuild completo..."
rm -rf dist
npm run build

echo ""
echo "2️⃣ Recopiando TUDO..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

echo ""
echo "3️⃣ Adicionando timestamp ao index.html para forçar atualização..."
TIMESTAMP=$(date +%s)
sudo sed -i "s|</head>|<meta http-equiv=\"Cache-Control\" content=\"no-cache, no-store, must-revalidate\"><meta http-equiv=\"Pragma\" content=\"no-cache\"><meta http-equiv=\"Expires\" content=\"0\"><!-- Version: $TIMESTAMP --></head>|" /var/www/html/index.html

echo ""
echo "4️⃣ Verificando referências..."
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html

echo ""
echo "5️⃣ Reiniciando Nginx completamente (não apenas reload)..."
sudo systemctl stop nginx
sleep 2
sudo rm -rf /var/cache/nginx/*
sudo systemctl start nginx
sleep 2

echo ""
echo "6️⃣ Testando..."
curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "✅ CONCLUÍDO!"
echo ""
echo "📋 TESTE NO NAVEGADOR AGORA:"
echo "   1. Feche TODAS as abas"
echo "   2. Abra janela anônima (Ctrl+Shift+N)"
echo "   3. Acesse: https://app.ativafix.com/integracoes"
echo "   4. A seção 'Integração Telegram' deve aparecer"

