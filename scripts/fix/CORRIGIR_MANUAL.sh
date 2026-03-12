#!/bin/bash

echo "🔧 CORREÇÃO MANUAL DO index.html"
echo "================================="
echo ""

# Verificar o que está no arquivo
echo "1️⃣ Verificando referências atuais..."
grep -n 'index-' /var/www/html/index.html | head -5

echo ""
echo "2️⃣ Fazendo backup..."
sudo cp /var/www/html/index.html /var/www/html/index.html.backup

echo ""
echo "3️⃣ Substituindo todas as ocorrências..."
sudo sed -i 's/index-ecSPLH9U/index-B3J_Mk_8/g' /var/www/html/index.html

echo ""
echo "4️⃣ Verificando se funcionou..."
grep -n 'index-' /var/www/html/index.html | head -5

echo ""
echo "5️⃣ Se ainda não funcionou, recopiando do dist..."
if grep -q 'index-ecSPLH9U' /var/www/html/index.html; then
    echo "   ⚠️ Ainda há referências antigas! Recopiando tudo..."
    cd /root/primecamp-ofc
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
    sudo chown -R www-data:www-data /var/www/html/
    echo "   ✅ Recopiado"
else
    echo "   ✅ Correção funcionou!"
fi

echo ""
echo "6️⃣ Verificando referências finais..."
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html | sort -u

echo ""
echo "7️⃣ Limpando cache..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

echo ""
echo "8️⃣ Testando..."
curl -s https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u

