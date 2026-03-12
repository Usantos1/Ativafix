#!/bin/bash
set -e

echo "🔥 DEPLOY FORÇANDO REBUILD COMPLETO"
echo "===================================="
echo ""

cd /root/primecamp-ofc || {
    echo "❌ Erro: Diretório não encontrado"
    exit 1
}

echo "1️⃣ Atualizando código..."
git pull origin main
echo "✅ Código atualizado"

echo ""
echo "2️⃣ Verificando código fonte..."
if ! grep -q "showAlreadyAppliedModal.*useState" src/pages/JobApplicationSteps.tsx; then
    echo "❌ ERRO: Código fonte não tem showAlreadyAppliedModal!"
    exit 1
fi
echo "✅ Código fonte OK"

echo ""
echo "3️⃣ REMOVENDO TUDO (dist, cache, node_modules/.vite)..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf .vite
echo "✅ Limpeza completa"

echo ""
echo "4️⃣ Fazendo BUILD (pode demorar 2-5 minutos)..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ERRO no build!"
    exit 1
fi
echo "✅ Build concluído"

echo ""
echo "5️⃣ VERIFICANDO se showAlreadyAppliedModal está no build..."
if ! grep -r "showAlreadyAppliedModal" dist/ 2>/dev/null | head -1 > /dev/null; then
    echo "❌ ERRO CRÍTICO: showAlreadyAppliedModal NÃO está no build compilado!"
    echo "   Isso significa que o build não incluiu o código atualizado."
    echo "   Verificando arquivo fonte novamente..."
    grep -n "showAlreadyAppliedModal" src/pages/JobApplicationSteps.tsx || echo "   NÃO ENCONTRADO NO CÓDIGO FONTE!"
    exit 1
fi
echo "✅ showAlreadyAppliedModal encontrado no build"

echo ""
echo "6️⃣ Limpando diretório do Nginx..."
NGINX_ROOT="/var/www/ativafix"
sudo rm -rf "$NGINX_ROOT"/*
echo "✅ Nginx limpo"

echo ""
echo "7️⃣ Copiando arquivos compilados..."
sudo cp -r dist/* "$NGINX_ROOT"/
echo "✅ Arquivos copiados"

echo ""
echo "8️⃣ Ajustando permissões..."
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
echo "✅ Permissões ajustadas"

echo ""
echo "9️⃣ Verificando se showAlreadyAppliedModal está no Nginx..."
if ! sudo grep -r "showAlreadyAppliedModal" "$NGINX_ROOT" 2>/dev/null | head -1 > /dev/null; then
    echo "❌ ERRO: showAlreadyAppliedModal NÃO está no diretório do Nginx!"
    exit 1
fi
echo "✅ showAlreadyAppliedModal confirmado no Nginx"

echo ""
echo "🔟 Limpando cache do Nginx..."
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true
sudo rm -rf /var/lib/nginx/cache/* 2>/dev/null || true
sudo systemctl reload nginx
echo "✅ Cache limpo e Nginx recarregado"

echo ""
echo "🎉 DEPLOY COMPLETO FINALIZADO!"
echo ""
echo "📋 AGORA NO NAVEGADOR:"
echo "1. Feche TODAS as abas do ativafix"
echo "2. Ctrl+Shift+Delete → Limpar cache completamente"
echo "3. OU use modo anônimo (Ctrl+Shift+N)"
echo "4. Acesse: https://app.ativafix.com/vaga/atendente-cs"
echo ""
