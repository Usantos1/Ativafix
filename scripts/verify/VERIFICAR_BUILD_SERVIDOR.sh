#!/bin/bash

echo "🔍 VERIFICAR SE O CÓDIGO FOI COMPILADO CORRETAMENTE"
echo "=================================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando código fonte..."
if grep -q "showAlreadyAppliedModal.*useState" src/pages/JobApplicationSteps.tsx; then
    echo "✅ Código fonte está correto (showAlreadyAppliedModal declarado)"
else
    echo "❌ ERRO: Código fonte NÃO tem showAlreadyAppliedModal!"
    exit 1
fi

echo ""
echo "2️⃣ Verificando se dist/ existe..."
if [ ! -d "dist" ]; then
    echo "❌ ERRO: Diretório dist/ não existe! Execute 'npm run build' primeiro."
    exit 1
fi
echo "✅ Diretório dist/ existe"

echo ""
echo "3️⃣ Procurando por showAlreadyAppliedModal no arquivo compilado..."
if grep -r "showAlreadyAppliedModal" dist/ 2>/dev/null | head -5; then
    echo "✅ showAlreadyAppliedModal encontrado no build compilado"
else
    echo "❌ ERRO: showAlreadyAppliedModal NÃO encontrado no build!"
    echo "   Isso significa que o build não incluiu o código atualizado."
    echo ""
    echo "   SOLUÇÃO: Execute um rebuild completo:"
    echo "   rm -rf dist node_modules/.vite && npm run build"
    exit 1
fi

echo ""
echo "4️⃣ Verificando se os arquivos foram copiados para o Nginx..."
NGINX_ROOT="/var/www/ativafix"
if [ -d "$NGINX_ROOT" ]; then
    if grep -r "showAlreadyAppliedModal" "$NGINX_ROOT" 2>/dev/null | head -1; then
        echo "✅ showAlreadyAppliedModal encontrado no diretório do Nginx"
    else
        echo "❌ ERRO: showAlreadyAppliedModal NÃO encontrado no diretório do Nginx!"
        echo "   Os arquivos não foram copiados ou estão desatualizados."
        echo ""
        echo "   SOLUÇÃO: Execute:"
        echo "   sudo rm -rf $NGINX_ROOT/* && sudo cp -r dist/* $NGINX_ROOT/"
    fi
else
    echo "⚠️  Diretório do Nginx não encontrado: $NGINX_ROOT"
fi

echo ""
echo "✅ Verificação concluída!"
