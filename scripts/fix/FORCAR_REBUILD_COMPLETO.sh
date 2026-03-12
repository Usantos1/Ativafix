#!/bin/bash

echo "🔥 FORÇAR REBUILD COMPLETO - TUDO DO ZERO"
echo "=========================================="
echo ""

cd /root/primecamp-ofc || { echo "❌ Erro: Não foi possível entrar no diretório"; exit 1; }

# 1. Atualizar código
echo "1. Atualizando código do Git..."
git fetch origin
git reset --hard origin/main
git clean -fd
git pull origin main || { echo "❌ Erro: git pull falhou"; exit 1; }
echo "✅ Código atualizado"

# 2. Verificar arquivos críticos
echo ""
echo "2. Verificando arquivos críticos..."
if ! grep -q 'path="/test-auth"' src/App.tsx; then
    echo "❌ ERRO: Rota /test-auth não encontrada no App.tsx!"
    exit 1
fi
echo "✅ Rota /test-auth encontrada no App.tsx (componente inline)"

# Verificar ordem das rotas
TEST_AUTH_LINE=$(grep -n 'path="/test-auth"' src/App.tsx | cut -d: -f1)
CATCH_ALL_LINE=$(grep -n 'path="\*"' src/App.tsx | cut -d: -f1)
if [ "$TEST_AUTH_LINE" -ge "$CATCH_ALL_LINE" ]; then
    echo "❌ ERRO: Rota /test-auth está DEPOIS do catch-all!"
    exit 1
fi
echo "✅ Rota /test-auth está ANTES do catch-all (linha $TEST_AUTH_LINE < $CATCH_ALL_LINE)"

# 3. LIMPAR TUDO
echo ""
echo "3. LIMPANDO TUDO (builds, caches, node_modules)..."
rm -rf dist node_modules/.vite .vite node_modules/.cache .next build
rm -rf node_modules
echo "✅ Limpeza completa"

# 4. Reinstalar dependências
echo ""
echo "4. Reinstalando dependências..."
npm install || { echo "❌ ERRO: npm install falhou!"; exit 1; }
echo "✅ Dependências instaladas"

# 5. Rebuildar
echo ""
echo "5. Rebuildando frontend (isso pode demorar)..."
npm run build || { echo "❌ ERRO: Build falhou!"; exit 1; }
echo "✅ Build concluído"

# 6. Verificar build
echo ""
echo "6. Verificando build..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ ERRO: dist/index.html não foi criado!"
    exit 1
fi
echo "✅ dist/index.html existe"

# Verificar se TestAuth está no bundle
echo ""
echo "7. Procurando TestAuth no bundle..."
BUNDLE_FILES=$(find dist/assets -name "*.js" -type f)
FOUND=0
for file in $BUNDLE_FILES; do
    if grep -q "test-auth\|TestAuth" "$file" 2>/dev/null; then
        echo "✅ Encontrado em: $file"
        FOUND=1
        # Mostrar contexto
        grep -o "test-auth\|TestAuth" "$file" | head -3
    fi
done

if [ $FOUND -eq 0 ]; then
    echo "⚠️  AVISO: 'test-auth' não encontrado no bundle (pode estar minificado)"
    echo "   Verificando tamanho dos arquivos..."
    ls -lh dist/assets/*.js | head -5
fi

# 7. Copiar para servidor
echo ""
echo "8. Copiando para servidor web..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
echo "✅ Arquivos copiados"

# 8. Recarregar Nginx
echo ""
echo "9. Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado"

# 9. Verificar API
echo ""
echo "10. Verificando API..."
if pm2 list | grep -q "primecamp-api.*online"; then
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
    if [ "$HEALTH" = "200" ]; then
        echo "✅ API está funcionando"
    else
        echo "⚠️  API não está respondendo corretamente"
    fi
else
    echo "⚠️  API não está rodando"
fi

echo ""
echo "========================================"
echo "🎉 REBUILD COMPLETO FINALIZADO!"
echo "========================================"
echo ""
echo "🌐 TESTE AGORA:"
echo "1. Abra em JANELA ANÔNIMA (Ctrl + Shift + N)"
echo "2. Acesse: https://app.ativafix.com/test-simple"
echo "   - Se funcionar: React Router está OK"
echo "3. Acesse: https://app.ativafix.com/test-auth"
echo "   - Abra Console (F12) e verifique logs"
echo "4. Se ainda não funcionar, verifique Network tab"
echo ""

