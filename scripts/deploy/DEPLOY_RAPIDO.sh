#!/bin/bash

echo "🚀 DEPLOY RÁPIDO - MODAL CHECKLIST + VALIDAÇÕES"
echo "================================================"
echo ""

cd /root/primecamp-ofc || { echo "❌ Erro: Diretório não encontrado."; exit 1; }

# 1. Atualizar código
echo "1️⃣ Atualizando código..."
git pull origin main || { echo "❌ Erro ao fazer pull"; exit 1; }
echo "✅ Código atualizado"
echo ""

# 2. Build do frontend
echo "2️⃣ Fazendo build do frontend..."
npm install --silent
npm run build || { echo "❌ Erro no build"; exit 1; }
echo "✅ Build concluído"
echo ""

# 3. Limpar cache e arquivos antigos
echo "3️⃣ Limpando cache e arquivos antigos..."
sudo rm -rf /var/cache/nginx/* 2>/dev/null
sudo rm -rf /var/www/ativafix/* 2>/dev/null
sudo rm -rf /var/www/ativafix/.* 2>/dev/null
sleep 1
echo "✅ Cache limpo"
echo ""

# 4. Copiar novos arquivos
echo "4️⃣ Copiando arquivos para o Nginx..."
sudo cp -r dist/* /var/www/ativafix/ || { echo "❌ Erro ao copiar arquivos"; exit 1; }
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix
echo "✅ Arquivos copiados"
echo ""

# 5. Recarregar Nginx
echo "5️⃣ Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx || { echo "❌ Erro ao recarregar Nginx"; exit 1; }
echo "✅ Nginx recarregado"
echo ""

echo "🎉 DEPLOY CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "2. Teste criar uma nova OS"
echo "3. Verifique se o modal de checklist abre automaticamente"
echo "4. Finalize o checklist e verifique a impressão automática"
echo ""
