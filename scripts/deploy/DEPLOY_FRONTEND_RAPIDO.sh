#!/bin/bash

echo "🚀 DEPLOY RÁPIDO DO FRONTEND"
echo "============================"
echo ""

cd /root/primecamp-ofc || { echo "❌ Erro: Não foi possível entrar no diretório"; exit 1; }

echo "1️⃣ Atualizando código..."
git pull origin main || { echo "❌ Erro: git pull falhou"; exit 1; }
echo "✅ Código atualizado"
echo ""

echo "2️⃣ Limpando builds antigos..."
rm -rf dist node_modules/.vite .vite node_modules/.cache
echo "✅ Limpeza concluída"
echo ""

echo "3️⃣ Fazendo build do frontend..."
npm run build || { echo "❌ ERRO: Build falhou!"; exit 1; }
echo "✅ Build concluído"
echo ""

echo "4️⃣ Verificando se dist/index.html foi criado..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ ERRO: dist/index.html não foi criado!"
    exit 1
fi
echo "✅ dist/index.html existe"
echo ""

echo "5️⃣ Copiando para /var/www/html..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
echo "✅ Arquivos copiados"
echo ""

echo "6️⃣ Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado"
echo ""

echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "📋 TESTAR AGORA:"
echo "1. Acesse: https://app.ativafix.com/admin/revenda"
echo "2. Abra em JANELA ANÔNIMA (Ctrl + Shift + N) para evitar cache"
echo "3. Ou pressione Ctrl + Shift + R para hard refresh"
echo ""

