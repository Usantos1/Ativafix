#!/bin/bash
echo "🔍 Verificando Nginx e arquivos deployados..."
echo ""

echo "1️⃣ Verificando configuração do Nginx..."
echo "Diretório root configurado:"
sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | head -1
sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-enabled/ativafix* 2>/dev/null | grep "root" | head -1

echo ""
echo "2️⃣ Verificando se index.html existe..."
if [ -f "/var/www/html/index.html" ]; then
  echo "  ✅ /var/www/html/index.html existe"
  echo "  📝 Tamanho: $(ls -lh /var/www/html/index.html | awk '{print $5}')"
  echo "  📅 Última modificação: $(stat -c %y /var/www/html/index.html 2>/dev/null || stat -f %Sm /var/www/html/index.html 2>/dev/null)"
else
  echo "  ❌ /var/www/html/index.html NÃO existe"
fi

echo ""
echo "3️⃣ Verificando arquivos JavaScript no diretório deployado..."
JS_COUNT=$(ls -1 /var/www/html/assets/*.js 2>/dev/null | wc -l)
echo "  📊 Total de arquivos JS: $JS_COUNT"
if [ "$JS_COUNT" -gt 0 ]; then
  echo "  📝 Últimos arquivos JS:"
  ls -lht /var/www/html/assets/*.js 2>/dev/null | head -3 | awk '{print "    "$9" - "$5" - "$6" "$7" "$8}'
fi

echo ""
echo "4️⃣ Verificando se FinanceiroNavMenu está no bundle..."
if grep -q "FinanceiroNavMenu" /var/www/html/assets/*.js 2>/dev/null; then
  echo "  ✅ FinanceiroNavMenu encontrado no bundle"
  grep -h "FinanceiroNavMenu" /var/www/html/assets/*.js 2>/dev/null | head -1 | cut -c1-100
else
  echo "  ❌ FinanceiroNavMenu NÃO encontrado no bundle"
  echo "  ⚠️  O build pode não ter incluído o componente"
fi

echo ""
echo "5️⃣ Verificando se scrollbar-thin está no CSS..."
if grep -q "scrollbar-thin" /var/www/html/assets/*.css 2>/dev/null; then
  echo "  ✅ scrollbar-thin encontrado no CSS"
  grep -h "scrollbar-thin" /var/www/html/assets/*.css 2>/dev/null | head -1 | cut -c1-100
else
  echo "  ❌ scrollbar-thin NÃO encontrado no CSS"
fi

echo ""
echo "6️⃣ Verificando cache do Nginx..."
echo "  📁 Cache directories:"
sudo du -sh /var/cache/nginx/* 2>/dev/null | head -5
sudo du -sh /var/lib/nginx/cache/* 2>/dev/null | head -5

echo ""
echo "7️⃣ Verificando se há build local (dist/)..."
if [ -d "dist" ]; then
  echo "  ✅ Diretório dist/ existe localmente"
  if [ -f "dist/index.html" ]; then
    echo "  ✅ dist/index.html existe"
    echo "  📝 Tamanho: $(ls -lh dist/index.html | awk '{print $5}')"
  fi
  DIST_JS_COUNT=$(ls -1 dist/assets/*.js 2>/dev/null | wc -l)
  echo "  📊 Arquivos JS em dist/: $DIST_JS_COUNT"
  if grep -q "FinanceiroNavMenu" dist/assets/*.js 2>/dev/null; then
    echo "  ✅ FinanceiroNavMenu está no build local"
  else
    echo "  ❌ FinanceiroNavMenu NÃO está no build local"
  fi
else
  echo "  ⚠️  Diretório dist/ não existe (precisa fazer build)"
fi

echo ""
echo "✅ Verificação concluída!"
