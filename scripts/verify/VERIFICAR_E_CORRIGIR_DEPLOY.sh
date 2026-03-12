#!/bin/bash
set -e

echo "🔍 VERIFICAR E CORRIGIR DEPLOY - DIAGNÓSTICO COMPLETO"
echo "====================================================="
echo ""

cd /root/primecamp-ofc || {
    echo "❌ Erro: Diretório não encontrado"
    exit 1
}

echo "1️⃣ Atualizando código do Git..."
git pull origin main
echo "✅ Código atualizado"

echo ""
echo "2️⃣ VERIFICANDO código fonte local..."
if ! grep -q "showAlreadyAppliedModal.*useState" src/pages/JobApplicationSteps.tsx; then
    echo "❌ ERRO CRÍTICO: Código fonte local NÃO tem showAlreadyAppliedModal!"
    echo "   Linha 245 deveria ter: const [showAlreadyAppliedModal, setShowAlreadyAppliedModal] = useState(false);"
    exit 1
fi
echo "✅ Código fonte LOCAL está correto (linha 245 tem showAlreadyAppliedModal)"

echo ""
echo "3️⃣ REMOVENDO build antigo completamente..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf .vite
echo "✅ Build antigo removido"

echo ""
echo "4️⃣ Fazendo BUILD novo (pode demorar 2-5 minutos)..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ERRO no build!"
    exit 1
fi
echo "✅ Build concluído"

echo ""
echo "5️⃣ VERIFICANDO se showAlreadyAppliedModal está no dist/ compilado..."
BUILD_RESULT=$(grep -r "showAlreadyAppliedModal" dist/ 2>/dev/null | head -3)
if [ -z "$BUILD_RESULT" ]; then
    echo "❌ ERRO CRÍTICO: showAlreadyAppliedModal NÃO encontrado no build compilado!"
    echo "   Isso significa que o código não foi incluído no build."
    echo ""
    echo "   DEBUG: Verificando código fonte novamente..."
    grep -n "showAlreadyAppliedModal" src/pages/JobApplicationSteps.tsx || echo "   NÃO ENCONTRADO no código fonte!"
    exit 1
fi
echo "✅ showAlreadyAppliedModal encontrado no build compilado"
echo "   Primeiras ocorrências:"
echo "$BUILD_RESULT" | head -3

echo ""
echo "6️⃣ Verificando arquivos atuais no Nginx..."
NGINX_ROOT="/var/www/ativafix"
if [ -d "$NGINX_ROOT" ]; then
    OLD_BUILD=$(sudo grep -r "showAlreadyAppliedModal" "$NGINX_ROOT" 2>/dev/null | head -1 || echo "")
    if [ -n "$OLD_BUILD" ]; then
        echo "⚠️  AVISO: showAlreadyAppliedModal JÁ existe no Nginx (pode ser versão antiga)"
    else
        echo "ℹ️  showAlreadyAppliedModal não encontrado no Nginx (será adicionado agora)"
    fi
else
    echo "⚠️  Diretório do Nginx não encontrado: $NGINX_ROOT"
fi

echo ""
echo "7️⃣ Limpando diretório do Nginx COMPLETAMENTE..."
sudo rm -rf "$NGINX_ROOT"/*
echo "✅ Nginx limpo"

echo ""
echo "8️⃣ Copiando arquivos COMPILADOS para o Nginx..."
sudo cp -r dist/* "$NGINX_ROOT"/
echo "✅ Arquivos copiados"

echo ""
echo "9️⃣ Ajustando permissões..."
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
echo "✅ Permissões ajustadas"

echo ""
echo "🔟 VERIFICANDO se showAlreadyAppliedModal está no Nginx APÓS cópia..."
if ! sudo grep -r "showAlreadyAppliedModal" "$NGINX_ROOT" 2>/dev/null | head -1 > /dev/null; then
    echo "❌ ERRO: showAlreadyAppliedModal NÃO está no Nginx após cópia!"
    echo "   Isso é muito estranho. Verificando dist/ novamente..."
    grep -r "showAlreadyAppliedModal" dist/ | head -3
    exit 1
fi
echo "✅ CONFIRMADO: showAlreadyAppliedModal está no Nginx"
NEW_BUILD=$(sudo grep -r "showAlreadyAppliedModal" "$NGINX_ROOT" 2>/dev/null | head -1)
echo "   Ocorrência encontrada: ${NEW_BUILD:0:100}..."

echo ""
echo "1️⃣1️⃣ Limpando cache do Nginx..."
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true
sudo rm -rf /var/lib/nginx/cache/* 2>/dev/null || true
sudo systemctl reload nginx
echo "✅ Cache limpo e Nginx recarregado"

echo ""
echo "🎉 DEPLOY COMPLETO E VERIFICADO!"
echo ""
echo "📋 RESUMO:"
echo "  ✅ Código fonte: CORRETO"
echo "  ✅ Build compilado: CONTÉM showAlreadyAppliedModal"
echo "  ✅ Nginx: ATUALIZADO com novo build"
echo ""
echo "🌐 TESTE NO NAVEGADOR:"
echo "  1. Feche TODAS as abas do ativafix"
echo "  2. Use modo anônimo (Ctrl+Shift+N) OU limpe cache (Ctrl+Shift+Delete)"
echo "  3. Acesse: https://app.ativafix.com/vaga/Aux-tecnico"
echo ""
