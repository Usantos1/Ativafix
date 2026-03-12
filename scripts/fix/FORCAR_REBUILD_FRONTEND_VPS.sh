#!/bin/bash

echo "🔥 FORÇANDO REBUILD COMPLETO DO FRONTEND"
echo "========================================"
echo ""

cd /root/primecamp-ofc || { echo "Erro: Diretório não encontrado."; exit 1; }

echo "1️⃣ Limpando build anterior..."
rm -rf dist
rm -rf node_modules/.vite
echo "✅ Limpeza concluída."

echo ""
echo "2️⃣ Atualizando código..."
git pull origin main
echo "✅ Código atualizado."

echo ""
echo "3️⃣ Fazendo build do frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer build do frontend."
    exit 1
fi
echo "✅ Build concluído."

echo ""
echo "4️⃣ Removendo cache do Nginx..."
sudo rm -rf /var/cache/nginx/*
echo "✅ Cache do Nginx removido."

echo ""
echo "5️⃣ Copiando arquivos para o Nginx..."
sudo rm -rf /var/www/ativafix/*
sudo cp -r dist/* /var/www/ativafix/
echo "✅ Arquivos copiados."

echo ""
echo "6️⃣ Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado."

echo ""
echo "🎉 REBUILD FORÇADO CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Abra o navegador em MODO ANÔNIMO (Ctrl+Shift+N)"
echo "2. Acesse: https://app.ativafix.com"
echo "3. Faça login"
echo "4. Abra o console (F12)"
echo "5. Procure por: '[AppSidebar] Verificação de permissões'"
echo "6. Se o log NÃO aparecer, o problema está no deploy"
echo ""

