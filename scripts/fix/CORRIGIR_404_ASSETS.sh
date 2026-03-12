#!/bin/bash

echo "🔧 CORRIGINDO 404 EM ASSETS"
echo "============================"
echo ""

NGINX_ROOT="/var/www/ativafix"

echo "1️⃣ Verificando se o arquivo existe..."
if [ -f "$NGINX_ROOT/assets/index-B2StyxFt.js" ]; then
    echo "   ✅ Arquivo existe"
    ls -lh "$NGINX_ROOT/assets/index-B2StyxFt.js"
else
    echo "   ❌ Arquivo NÃO existe!"
    echo "   Listando arquivos em assets:"
    ls -lh "$NGINX_ROOT/assets/" | head -10
    exit 1
fi

echo ""
echo "2️⃣ Verificando permissões..."
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
echo "   ✅ Permissões ajustadas"

echo ""
echo "3️⃣ Verificando configuração do Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/ativafix"
if [ -f "$NGINX_CONFIG" ]; then
    echo "   Verificando se há location /assets..."
    if grep -q "location /assets" "$NGINX_CONFIG"; then
        echo "   ✅ Location /assets encontrado"
        grep -A 5 "location /assets" "$NGINX_CONFIG"
    else
        echo "   ⚠️ Location /assets NÃO encontrado"
        echo "   Verificando location /..."
        grep -A 10 "location /" "$NGINX_ROOT" "$NGINX_CONFIG" 2>/dev/null | head -15
    fi
else
    echo "   ⚠️ Arquivo de configuração não encontrado"
    echo "   Procurando em sites-enabled..."
    NGINX_CONFIG_ENABLED="/etc/nginx/sites-enabled/ativafix"
    if [ -f "$NGINX_CONFIG_ENABLED" ]; then
        echo "   ✅ Encontrado em sites-enabled"
        if grep -q "location /assets" "$NGINX_CONFIG_ENABLED"; then
            echo "   ✅ Location /assets encontrado"
        else
            echo "   ⚠️ Location /assets NÃO encontrado"
        fi
    fi
fi

echo ""
echo "4️⃣ Testando acesso local..."
if curl -I http://localhost/assets/index-B2StyxFt.js 2>/dev/null | grep -q "200\|HTTP/2 200"; then
    echo "   ✅ Arquivo acessível via localhost"
else
    echo "   ❌ Arquivo NÃO acessível via localhost"
    echo "   Headers:"
    curl -I http://localhost/assets/index-B2StyxFt.js 2>/dev/null | head -5
fi

echo ""
echo "5️⃣ Verificando se o diretório assets existe..."
if [ -d "$NGINX_ROOT/assets" ]; then
    echo "   ✅ Diretório assets existe"
    echo "   Arquivos em assets:"
    ls -lh "$NGINX_ROOT/assets/" | head -5
else
    echo "   ❌ Diretório assets NÃO existe!"
    echo "   Criando diretório..."
    sudo mkdir -p "$NGINX_ROOT/assets"
    sudo chown -R www-data:www-data "$NGINX_ROOT/assets"
    sudo chmod -R 755 "$NGINX_ROOT/assets"
fi

echo ""
echo "6️⃣ Verificando root do Nginx..."
if grep -q "root " "$NGINX_CONFIG" 2>/dev/null || grep -q "root " "$NGINX_CONFIG_ENABLED" 2>/dev/null; then
    echo "   Root configurado:"
    grep "root " "$NGINX_CONFIG" "$NGINX_CONFIG_ENABLED" 2>/dev/null | head -1
else
    echo "   ⚠️ Root não encontrado na configuração"
fi

echo ""
echo "7️⃣ Recopiando arquivos do dist..."
cd /root/primecamp-ofc
if [ -d "dist/assets" ]; then
    echo "   Copiando assets do dist..."
    sudo cp -r dist/assets/* "$NGINX_ROOT/assets/"
    sudo chown -R www-data:www-data "$NGINX_ROOT/assets"
    sudo chmod -R 755 "$NGINX_ROOT/assets"
    echo "   ✅ Arquivos copiados"
    
    echo "   Verificando se o arquivo existe agora..."
    if [ -f "$NGINX_ROOT/assets/index-B2StyxFt.js" ]; then
        echo "   ✅ Arquivo existe após cópia"
        ls -lh "$NGINX_ROOT/assets/index-B2StyxFt.js"
    else
        echo "   ❌ Arquivo ainda não existe!"
        echo "   Listando o que foi copiado:"
        ls -lh "$NGINX_ROOT/assets/" | head -10
    fi
else
    echo "   ❌ Diretório dist/assets não existe!"
    echo "   Execute: npm run build"
fi

echo ""
echo "8️⃣ Reiniciando Nginx..."
sudo systemctl restart nginx
sleep 2
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "9️⃣ Testando acesso novamente..."
if curl -I http://localhost/assets/index-B2StyxFt.js 2>/dev/null | grep -q "200\|HTTP/2 200"; then
    echo "   ✅ Arquivo agora está acessível!"
else
    echo "   ❌ Arquivo ainda não está acessível"
    echo "   Verifique a configuração do Nginx manualmente"
fi

echo ""
echo "✅ Verificação concluída!"
