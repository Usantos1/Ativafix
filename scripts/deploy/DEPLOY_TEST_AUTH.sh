#!/bin/bash

echo "🚀 Deploy da página de teste /test-auth..."

cd /root/primecamp-ofc || { echo "❌ Erro: Não foi possível entrar no diretório"; exit 1; }

echo "1. Atualizando código..."
git pull origin main || { echo "❌ Erro: git pull falhou"; exit 1; }

echo "2. Verificando se TestAuth.tsx existe..."
if [ ! -f "src/pages/TestAuth.tsx" ]; then
    echo "❌ ERRO: Arquivo src/pages/TestAuth.tsx não encontrado!"
    exit 1
fi
echo "✅ Arquivo TestAuth.tsx encontrado"

echo "3. Verificando se a rota está no App.tsx..."
if ! grep -q "test-auth" src/App.tsx; then
    echo "❌ ERRO: Rota /test-auth não encontrada no App.tsx!"
    exit 1
fi
echo "✅ Rota /test-auth encontrada no App.tsx"

echo "4. Limpando builds antigos..."
rm -rf dist node_modules/.vite .vite node_modules/.cache
echo "✅ Limpeza concluída"

echo "5. Instalando dependências (se necessário)..."
npm install --silent || { echo "❌ Erro: npm install falhou"; exit 1; }
echo "✅ Dependências OK"

echo "6. Rebuildando aplicação..."
npm run build || { echo "❌ ERRO: Build falhou!"; exit 1; }
echo "✅ Build concluído"

echo "7. Verificando se dist/index.html foi criado..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ ERRO: dist/index.html não foi criado!"
    exit 1
fi
echo "✅ dist/index.html existe"

echo "8. Verificando se TestAuth está no bundle..."
if grep -r "TestAuth" dist/assets/*.js > /dev/null 2>&1; then
    echo "✅ TestAuth encontrado no bundle JavaScript"
else
    echo "⚠️  AVISO: TestAuth não encontrado no bundle (pode estar em outro arquivo)"
fi

echo "9. Copiando arquivos para servidor web..."
sudo rm -rf /var/www/html/assets /var/www/html/*.js /var/www/html/*.css /var/www/html/*.html
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
echo "✅ Arquivos copiados"

echo "10. Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado"

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Limpe o cache do navegador (Ctrl + Shift + Delete)"
echo "2. Faça hard refresh (Ctrl + Shift + R)"
echo "3. Acesse: https://app.ativafix.com/test-auth"
echo ""
echo "Se ainda não funcionar, verifique:"
echo "- pm2 logs primecamp-api (API deve estar rodando)"
echo "- Verifique o console do navegador (F12)"
echo "- Verifique se há erros no Network tab"

