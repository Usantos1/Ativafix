#!/bin/bash

echo "🔍 DIAGNOSTICANDO ROTA /admin/configuracoes/pagamentos"
echo "======================================================"
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando código fonte (App.tsx)..."
if grep -q "/admin/configuracoes/pagamentos" src/App.tsx; then
    echo "   ✅ Rota encontrada no código fonte"
    grep -B 2 -A 2 "/admin/configuracoes/pagamentos" src/App.tsx
else
    echo "   ❌ Rota NÃO encontrada no código fonte!"
    exit 1
fi
echo ""

echo "2️⃣ Verificando se PaymentMethodsConfig está importado..."
if grep -q "PaymentMethodsConfig" src/App.tsx; then
    echo "   ✅ PaymentMethodsConfig está importado"
    grep "PaymentMethodsConfig" src/App.tsx | head -2
else
    echo "   ❌ PaymentMethodsConfig NÃO está importado!"
    exit 1
fi
echo ""

echo "3️⃣ Verificando se dist/ existe..."
if [ -d "dist" ]; then
    echo "   ✅ Diretório dist/ existe"
    
    echo ""
    echo "   Procurando rota no build..."
    if grep -r "configuracoes/pagamentos" dist/assets/*.js 2>/dev/null | head -1 > /dev/null; then
        echo "   ✅ Rota encontrada no build"
        grep -r "configuracoes/pagamentos" dist/assets/*.js 2>/dev/null | head -1 | cut -c1-200
    else
        echo "   ❌ Rota NÃO encontrada no build!"
        echo "   ⚠️ O build não inclui a rota - precisa fazer rebuild"
    fi
else
    echo "   ❌ Diretório dist/ não existe! Precisa fazer build primeiro."
    exit 1
fi
echo ""

echo "4️⃣ Verificando arquivos no servidor..."
NGINX_ROOT="/var/www/ativafix"
if grep -r "configuracoes/pagamentos" "$NGINX_ROOT"/assets/*.js 2>/dev/null | head -1 > /dev/null; then
    echo "   ✅ Rota encontrada nos arquivos do servidor"
    grep -r "configuracoes/pagamentos" "$NGINX_ROOT"/assets/*.js 2>/dev/null | head -1 | cut -c1-200
else
    echo "   ❌ Rota NÃO encontrada nos arquivos do servidor!"
    echo "   ⚠️ Os arquivos do servidor estão desatualizados"
fi
echo ""

echo "5️⃣ Verificando ordem das rotas no código fonte..."
CONFIG_PAGAMENTOS_LINE=$(grep -n 'path="/admin/configuracoes/pagamentos"' src/App.tsx | cut -d: -f1)
CONFIG_LINE=$(grep -n 'path="/admin/configuracoes"' src/App.tsx | grep -v "pagamentos" | cut -d: -f1)

if [ -n "$CONFIG_PAGAMENTOS_LINE" ] && [ -n "$CONFIG_LINE" ]; then
    if [ "$CONFIG_PAGAMENTOS_LINE" -lt "$CONFIG_LINE" ]; then
        echo "   ✅ Ordem correta: /admin/configuracoes/pagamentos (linha $CONFIG_PAGAMENTOS_LINE) vem ANTES de /admin/configuracoes (linha $CONFIG_LINE)"
    else
        echo "   ❌ Ordem INCORRETA: /admin/configuracoes (linha $CONFIG_LINE) vem ANTES de /admin/configuracoes/pagamentos (linha $CONFIG_PAGAMENTOS_LINE)"
        echo "   ⚠️ Isso causaria problemas de roteamento!"
    fi
else
    echo "   ⚠️ Não foi possível verificar a ordem"
fi
echo ""

echo "📋 RESUMO:"
echo "   Se a rota não está no build → Precisa fazer rebuild"
echo "   Se a rota não está no servidor → Precisa copiar arquivos"
echo "   Se a ordem está incorreta → Precisa corrigir App.tsx"
