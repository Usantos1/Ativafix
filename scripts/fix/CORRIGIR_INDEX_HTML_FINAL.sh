#!/bin/bash

echo "🔧 CORRIGINDO index.html PARA REFERENCIAR ARQUIVO CORRETO"
echo "=========================================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando arquivo JS correto no dist..."
BUNDLE_FILE=$(find dist/assets -name "index-*.js" -type f ! -name "*.es.js" | head -1)

if [ -z "$BUNDLE_FILE" ]; then
    echo "❌ Arquivo bundle não encontrado! Execute: npm run build"
    exit 1
fi

BUNDLE_NAME=$(basename "$BUNDLE_FILE")
echo "   ✅ Arquivo correto: $BUNDLE_NAME"

echo ""
echo "2️⃣ Verificando index.html no dist..."
if grep -q "$BUNDLE_NAME" dist/index.html; then
    echo "   ✅ dist/index.html já referencia arquivo correto"
else
    echo "   ⚠️ dist/index.html não referencia arquivo correto!"
    echo "   Arquivo referenciado:"
    grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1
    echo "   Fazendo rebuild..."
    npm run build
    BUNDLE_FILE=$(find dist/assets -name "index-*.js" -type f ! -name "*.es.js" | head -1)
    BUNDLE_NAME=$(basename "$BUNDLE_FILE")
fi

echo ""
echo "3️⃣ Verificando index.html no servidor web..."
CURRENT_REF=$(grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html | head -1 | sed 's|assets/||')

echo "   Arquivo referenciado atualmente: $CURRENT_REF"
echo "   Arquivo que deveria ser: $BUNDLE_NAME"

if [ "$CURRENT_REF" != "$BUNDLE_NAME" ]; then
    echo ""
    echo "   ⚠️ MISMATCH! Corrigindo..."
    
    # Fazer backup
    sudo cp /var/www/html/index.html /var/www/html/index.html.backup.$(date +%Y%m%d_%H%M%%S)
    
    # Substituir referência
    sudo sed -i "s|assets/$CURRENT_REF|assets/$BUNDLE_NAME|g" /var/www/html/index.html
    
    echo "   ✅ index.html atualizado"
    
    # Verificar
    NEW_REF=$(grep -o 'assets/index-[^"]*\.js' /var/www/html/index.html | head -1 | sed 's|assets/||')
    echo "   Nova referência: $NEW_REF"
    
    if [ "$NEW_REF" = "$BUNDLE_NAME" ]; then
        echo "   ✅ Correção confirmada!"
    else
        echo "   ❌ Erro na correção! Restaurando backup e recopiando tudo..."
        sudo rm -rf /var/www/html/*
        sudo cp -r dist/* /var/www/html/
        sudo chown -R www-data:www-data /var/www/html/
    fi
else
    echo "   ✅ index.html já referencia arquivo correto"
fi

echo ""
echo "4️⃣ Removendo arquivo JS antigo do servidor..."
sudo rm -f /var/www/html/assets/index-ecSPLH9U.js
echo "   ✅ Arquivo antigo removido"

echo ""
echo "5️⃣ Verificando se arquivo novo existe..."
if [ -f "/var/www/html/assets/$BUNDLE_NAME" ]; then
    echo "   ✅ Arquivo novo existe: $BUNDLE_NAME"
    echo "   Tamanho: $(du -h /var/www/html/assets/$BUNDLE_NAME | cut -f1)"
else
    echo "   ❌ Arquivo novo NÃO existe! Copiando..."
    sudo cp "$BUNDLE_FILE" /var/www/html/assets/
    sudo chown www-data:www-data /var/www/html/assets/"$BUNDLE_NAME"
fi

echo ""
echo "6️⃣ Limpando cache do Nginx..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
echo "   ✅ Cache limpo"

echo ""
echo "7️⃣ Testando o que está sendo servido..."
echo "   index.html referencia:"
curl -s https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | head -1

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "📋 TESTE AGORA:"
echo "   1. Feche TODAS as abas"
echo "   2. Abra janela anônima (Ctrl+Shift+N)"
echo "   3. Acesse: https://app.ativafix.com/integracoes"
echo "   4. Abra Network tab (F12)"
echo "   5. Verifique qual arquivo JS está sendo carregado"
echo "   6. Deve ser: $BUNDLE_NAME"

