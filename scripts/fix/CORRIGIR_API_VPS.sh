#!/bin/bash

echo "🔧 CORRIGINDO API NO VPS"
echo "========================"
echo ""

cd /root/primecamp-ofc || { echo "Erro: Diretório /root/primecamp-ofc não encontrado."; exit 1; }

echo "1️⃣ Parando todos os processos PM2..."
pm2 stop all
pm2 delete all
echo "✅ PM2 parado e processos removidos."

echo ""
echo "2️⃣ Matando qualquer processo na porta 3000..."
PID=$(lsof -ti:3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | head -1)
if [ -n "$PID" ]; then
    echo "   Processo encontrado: PID $PID"
    kill -9 "$PID" 2>/dev/null || true
    sleep 2
    echo "✅ Processo morto."
else
    echo "   Nenhum processo encontrado na porta 3000."
    echo "✅ Porta já livre."
fi

echo ""
echo "3️⃣ Atualizando código do repositório..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Erro ao atualizar o código. Abortando."
    exit 1
fi
echo "✅ Código atualizado."

echo ""
echo "4️⃣ Verificando sintaxe do código Node.js..."
cd server
node --check index.js
if [ $? -ne 0 ]; then
    echo "❌ Erro de sintaxe em index.js"
    exit 1
fi

node --check routes/reseller.js
if [ $? -ne 0 ]; then
    echo "❌ Erro de sintaxe em routes/reseller.js"
    exit 1
fi

node --check middleware/companyMiddleware.js
if [ $? -ne 0 ]; then
    echo "❌ Erro de sintaxe em middleware/companyMiddleware.js"
    exit 1
fi
echo "✅ Sintaxe do código verificada."

echo ""
echo "5️⃣ Iniciando servidor API com PM2..."
cd /root/primecamp-ofc/server
pm2 start index.js --name primecamp-api
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar o servidor PM2."
    echo "Verificando logs..."
    pm2 logs primecamp-api --lines 20 --nostream
    exit 1
fi
sleep 5
echo "✅ Servidor API iniciado."

echo ""
echo "6️⃣ Verificando status do PM2..."
pm2 status

echo ""
echo "7️⃣ Testando se a API está respondendo..."
sleep 3
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ API está respondendo (HTTP $RESPONSE)"
else
    echo "❌ API não está respondendo corretamente (HTTP $RESPONSE)"
    echo "Verificando logs..."
    pm2 logs primecamp-api --lines 30 --nostream | tail -30
fi

echo ""
echo "8️⃣ Verificando logs recentes do servidor..."
pm2 logs primecamp-api --lines 30 --nostream | tail -30

echo ""
echo "9️⃣ Verificando configuração do Nginx para api.ativafix..."
if [ -f /etc/nginx/sites-available/ativafix ]; then
    if grep -q "api.ativafix" /etc/nginx/sites-available/ativafix; then
        echo "✅ Configuração do Nginx encontrada para api.ativafix"
        echo "   Verificando se está habilitada..."
        if [ -L /etc/nginx/sites-enabled/ativafix ]; then
            echo "✅ Site habilitado no Nginx"
        else
            echo "⚠️  Site não está habilitado no Nginx"
            echo "   Execute: sudo ln -s /etc/nginx/sites-available/ativafix /etc/nginx/sites-enabled/"
        fi
    else
        echo "⚠️  Configuração do Nginx não encontrada para api.ativafix"
        echo "   Será necessário adicionar a configuração manualmente"
    fi
else
    echo "⚠️  Arquivo de configuração do Nginx não encontrado"
fi

echo ""
echo "🎉 PROCESSO DE CORREÇÃO CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Se a API não estiver respondendo, verifique os logs acima"
echo "2. Se o Nginx não estiver configurado, configure manualmente"
echo "3. Teste a API externamente: curl https://api.ativafix.com/api/health"
echo ""

