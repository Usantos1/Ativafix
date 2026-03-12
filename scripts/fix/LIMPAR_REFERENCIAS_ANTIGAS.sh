#!/bin/bash

echo "🧹 Limpando todas as referências antigas..."
echo "============================================"
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando referências no dist/index.html..."
grep -n 'index-ecSPLH9U.js' dist/index.html
if [ $? -eq 0 ]; then
    echo "   ⚠️ dist/index.html ainda tem referências antigas!"
    echo "   Fazendo rebuild..."
    rm -rf dist
    npm run build
else
    echo "   ✅ dist/index.html está limpo"
fi

echo ""
echo "2️⃣ Verificando referências no servidor web..."
grep -n 'index-ecSPLH9U.js' /var/www/html/index.html
if [ $? -eq 0 ]; then
    echo "   ⚠️ /var/www/html/index.html ainda tem referências antigas!"
    echo "   Removendo..."
    sudo sed -i 's/index-ecSPLH9U\.js/index-B3J_Mk_8.js/g' /var/www/html/index.html
    echo "   ✅ Referências removidas"
else
    echo "   ✅ /var/www/html/index.html está limpo"
fi

echo ""
echo "3️⃣ Removendo arquivo JS antigo..."
sudo rm -f /var/www/html/assets/index-ecSPLH9U.js
if [ $? -eq 0 ]; then
    echo "   ✅ Arquivo antigo removido"
else
    echo "   ℹ️ Arquivo antigo não existe (já foi removido)"
fi

echo ""
echo "4️⃣ Verificando todas as referências no index.html do servidor..."
echo "   Referências encontradas:"
grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html

echo ""
echo "5️⃣ Garantindo que só existe referência ao arquivo novo..."
CORRECT_FILE=$(find dist/assets -name "index-*.js" -type f ! -name "*.es.js" | head -1 | xargs basename)
echo "   Arquivo correto: $CORRECT_FILE"

# Recopiar tudo para garantir
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

echo ""
echo "6️⃣ Verificando referências finais..."
FINAL_REFS=$(grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html | sort -u)
echo "   Referências encontradas:"
echo "$FINAL_REFS"

if echo "$FINAL_REFS" | grep -q "index-ecSPLH9U.js"; then
    echo "   ❌ Ainda há referências antigas!"
    echo "   Removendo manualmente..."
    sudo sed -i 's/index-ecSPLH9U\.js/'"$CORRECT_FILE"'/g' /var/www/html/index.html
    FINAL_REFS=$(grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html | sort -u)
    echo "   Novas referências:"
    echo "$FINAL_REFS"
else
    echo "   ✅ Todas as referências estão corretas!"
fi

echo ""
echo "7️⃣ Limpando cache e recarregando Nginx..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx

echo ""
echo "8️⃣ Testando o que está sendo servido..."
SERVED=$(curl -s https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u)
echo "   Arquivos referenciados no HTML servido:"
echo "$SERVED"

if echo "$SERVED" | grep -q "index-B3J_Mk_8.js" && ! echo "$SERVED" | grep -q "index-ecSPLH9U.js"; then
    echo ""
    echo "✅ SUCESSO! O servidor está servindo apenas o arquivo correto!"
else
    echo ""
    echo "⚠️ Ainda há problemas. Verifique manualmente."
fi

