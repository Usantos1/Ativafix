#!/bin/bash

echo "🔍 VERIFICANDO E LIMPANDO TUDO"
echo "==============================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando dist/index.html..."
grep -n 'index-' dist/index.html

echo ""
echo "2️⃣ Verificando /var/www/html/index.html..."
grep -n 'index-' /var/www/html/index.html

echo ""
echo "3️⃣ Contando ocorrências..."
echo "   Referências a index-B3J_Mk_8.js:"
grep -c 'index-B3J_Mk_8.js' /var/www/html/index.html || echo "   0"
echo "   Referências a index-ecSPLH9U.js:"
grep -c 'index-ecSPLH9U.js' /var/www/html/index.html || echo "   0"

echo ""
echo "4️⃣ Removendo TODAS as referências antigas..."
sudo sed -i '/index-ecSPLH9U.js/d' /var/www/html/index.html

echo ""
echo "5️⃣ Verificando novamente..."
grep -n 'index-' /var/www/html/index.html

echo ""
echo "6️⃣ Se ainda houver problema, recopiando TUDO..."
if grep -q 'index-ecSPLH9U' /var/www/html/index.html; then
    echo "   ⚠️ Ainda há referências! Recopiando..."
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
    sudo chown -R www-data:www-data /var/www/html/
    
    # Remover referências antigas se ainda existirem
    sudo sed -i '/index-ecSPLH9U.js/d' /var/www/html/index.html
fi

echo ""
echo "7️⃣ Removendo arquivo JS antigo..."
sudo rm -f /var/www/html/assets/index-ecSPLH9U.js

echo ""
echo "8️⃣ Verificando arquivos JS disponíveis..."
ls -lh /var/www/html/assets/index-*.js 2>/dev/null | grep -v "\.es\.js"

echo ""
echo "9️⃣ Limpando TODOS os caches..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
sleep 2

echo ""
echo "🔟 Testando localmente..."
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html | sort -u

echo ""
echo "1️⃣1️⃣ Testando via HTTP..."
curl -s http://localhost/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "1️⃣2️⃣ Testando via HTTPS..."
curl -s -k https://localhost/ 2>/dev/null | grep -o 'assets/index-[^"]*\.js' | sort -u || curl -s https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u

