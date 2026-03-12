#!/bin/bash

echo "🔥 FORÇANDO ATUALIZAÇÃO DO FRONTEND"
echo "===================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Limpando cache e builds antigos..."
rm -rf dist node_modules/.vite .vite node_modules/.cache .next build
echo "   ✅ Limpeza concluída"

echo ""
echo "2️⃣ Fazendo pull das alterações..."
git pull origin main

echo ""
echo "3️⃣ Instalando dependências..."
npm install

echo ""
echo "4️⃣ Fazendo build do frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend!"
    exit 1
fi

echo ""
echo "5️⃣ Verificando se dist/index.html foi criado..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erro: dist/index.html não foi criado!"
    exit 1
fi
echo "   ✅ dist/index.html existe"

echo ""
echo "6️⃣ Verificando se Integration.tsx está no bundle..."
BUNDLE_FILES=$(find dist/assets -name "*.js" -type f 2>/dev/null | head -1)
if [ -n "$BUNDLE_FILES" ]; then
    if grep -q "Integração Telegram\|useTelegramConfig\|telegramChatIdEntrada" "$BUNDLE_FILES" 2>/dev/null; then
        echo "   ✅ Código do Telegram encontrado no bundle!"
    else
        echo "   ⚠️ Código do Telegram NÃO encontrado no bundle"
        echo "   Verificando arquivos..."
        ls -lh dist/assets/*.js | head -3
    fi
else
    echo "   ⚠️ Não foi possível verificar o bundle"
fi

echo ""
echo "7️⃣ Removendo arquivos antigos do servidor web..."
sudo rm -rf /var/www/html/*
echo "   ✅ Arquivos antigos removidos"

echo ""
echo "8️⃣ Copiando novos arquivos para /var/www/html/..."
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
echo "   ✅ Arquivos copiados"

echo ""
echo "9️⃣ Verificando arquivos copiados..."
if [ -f "/var/www/html/index.html" ]; then
    echo "   ✅ /var/www/html/index.html existe"
    FILE_SIZE=$(stat -f%z /var/www/html/index.html 2>/dev/null || stat -c%s /var/www/html/index.html 2>/dev/null)
    echo "   Tamanho: $FILE_SIZE bytes"
else
    echo "   ❌ /var/www/html/index.html NÃO existe!"
    exit 1
fi

echo ""
echo "🔟 Limpando cache do Nginx..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
echo "   ✅ Cache do Nginx limpo e recarregado"

echo ""
echo "1️⃣1️⃣ Verificando status do Nginx..."
sudo systemctl status nginx --no-pager -l | head -5

echo ""
echo "✅ ATUALIZAÇÃO FORÇADA CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS CRÍTICOS:"
echo "   1. Feche TODAS as abas do navegador com ativafix"
echo "   2. Limpe o cache do navegador COMPLETAMENTE:"
echo "      - Chrome/Edge: Ctrl+Shift+Delete → Marque 'Imagens e arquivos em cache' → Limpar"
echo "      - Ou use modo anônimo: Ctrl+Shift+N"
echo "   3. Acesse: https://app.ativafix.com/integracoes"
echo "   4. Abra o Console (F12) e verifique se ainda há erros"
echo "   5. Se ainda não aparecer, verifique:"
echo "      - ls -lh /var/www/html/assets/*.js | head -5"
echo "      - grep -r 'telegramChatIdEntrada' /var/www/html/assets/*.js"

