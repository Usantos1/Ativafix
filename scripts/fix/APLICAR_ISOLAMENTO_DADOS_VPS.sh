#!/bin/bash

echo "🔒 APLICANDO ISOLAMENTO DE DADOS POR COMPANY_ID"
echo "=============================================="
echo ""

cd /root/primecamp-ofc || { echo "Erro: Diretório /root/primecamp-ofc não encontrado."; exit 1; }

echo "1️⃣ Atualizando código do repositório..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Erro ao atualizar o código. Abortando."
    exit 1
fi
echo "✅ Código atualizado."

echo ""
echo "2️⃣ Reiniciando servidor API..."
pm2 restart primecamp-api
if [ $? -ne 0 ]; then
    echo "❌ Erro ao reiniciar o servidor. Verifique o status do PM2."
    exit 1
fi
sleep 5
echo "✅ Servidor API reiniciado."

echo ""
echo "3️⃣ Verificando status do PM2..."
pm2 status

echo ""
echo "4️⃣ Verificando logs recentes do servidor (últimas 20 linhas)..."
pm2 logs primecamp-api --lines 20 --nostream | tail -20

echo ""
echo "5️⃣ Fazendo deploy do frontend..."
cd /root/primecamp-ofc
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer build do frontend."
    exit 1
fi

# Copiar build para nginx
sudo cp -r dist/* /var/www/ativafix/
sudo systemctl reload nginx
echo "✅ Frontend atualizado."

echo ""
echo "🎉 ISOLAMENTO DE DADOS APLICADO COM SUCESSO!"
echo ""
echo "📋 O QUE FOI CORRIGIDO:"
echo "1. ✅ 'Gestão de Revenda' removida do sidebar para empresas clientes"
echo "2. ✅ Filtro automático de company_id em todas as queries SELECT"
echo "3. ✅ Filtro automático de company_id em todas as queries UPDATE"
echo "4. ✅ company_id adicionado automaticamente em todos os INSERTs"
echo "5. ✅ Middleware requireCompanyAccess aplicado em todas as rotas autenticadas"
echo ""
echo "🔍 TESTES RECOMENDADOS:"
echo "1. Fazer login como usuário da empresa 'Ativa CRM'"
echo "2. Verificar que 'Gestão de Revenda' NÃO aparece no sidebar"
echo "3. Verificar que produtos, vendas, clientes estão vazios (tabelas zeradas)"
echo "4. Verificar que não consegue acessar /admin/revenda (403 Forbidden)"
echo ""

