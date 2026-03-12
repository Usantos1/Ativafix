#!/bin/bash

echo "🔧 RECRIANDO CONFIGURAÇÃO DO NGINX CORRETAMENTE"
echo "==============================================="
echo ""

cd /root/primecamp-ofc || exit 1

echo "1️⃣ Verificando configuração existente de ativafix..."
if [ -f "/etc/nginx/sites-available/ativafix.conf" ]; then
    echo "   Configuração atual:"
    cat /etc/nginx/sites-available/ativafix.conf
    echo ""
    echo "   ✅ Usando configuração existente como base"
    BASE_CONFIG="/etc/nginx/sites-available/ativafix.conf"
else
    echo "   ⚠️ Configuração não encontrada, criando nova..."
    BASE_CONFIG=""
fi

echo ""
echo "2️⃣ Criando configuração atualizada..."

NGINX_CONFIG="/etc/nginx/sites-available/ativafix.conf"

# Se existe configuração anterior, fazer backup
if [ -f "$NGINX_CONFIG" ]; then
    sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Ler configuração existente para pegar SSL se existir
if [ -f "/etc/nginx/sites-available/ativafix.conf" ]; then
    SSL_CERT=$(grep "ssl_certificate" /etc/nginx/sites-available/ativafix.conf | head -1 | awk '{print $2}' | tr -d ';')
    SSL_KEY=$(grep "ssl_certificate_key" /etc/nginx/sites-available/ativafix.conf | head -1 | awk '{print $2}' | tr -d ';')
    
    if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
        echo "   ✅ Certificados SSL encontrados"
        USE_SSL=true
    else
        echo "   ⚠️ Certificados SSL não encontrados, usando HTTP apenas"
        USE_SSL=false
    fi
else
    USE_SSL=false
fi

# Criar configuração
if [ "$USE_SSL" = true ]; then
    sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ativafix www.ativafix;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ativafix www.ativafix;
    
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    
    root /var/www/html;
    index index.html;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Anti-cache para index.html (solução aplicada anteriormente)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header X-Content-Type-Options "nosniff";
        try_files \$uri =404;
    }
    
    # Configuração SPA - React Router
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }
    
    # Arquivos estáticos JS/CSS sem cache
    location ~* \.(js|css)$ {
        expires 0;
        add_header Cache-Control "no-cache, must-revalidate";
        add_header Pragma "no-cache";
        access_log off;
    }
    
    # Outros assets com cache normal
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Logs
    access_log /var/log/nginx/ativafix.access.log;
    error_log /var/log/nginx/ativafix.error.log;
}
EOF
else
    sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ativafix www.ativafix;
    
    root /var/www/html;
    index index.html;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Anti-cache para index.html (solução aplicada anteriormente)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header X-Content-Type-Options "nosniff";
        try_files \$uri =404;
    }
    
    # Configuração SPA - React Router
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }
    
    # Arquivos estáticos JS/CSS sem cache
    location ~* \.(js|css)$ {
        expires 0;
        add_header Cache-Control "no-cache, must-revalidate";
        add_header Pragma "no-cache";
        access_log off;
    }
    
    # Outros assets com cache normal
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Logs
    access_log /var/log/nginx/ativafix.access.log;
    error_log /var/log/nginx/ativafix.error.log;
}
EOF
fi

echo "   ✅ Configuração criada"

echo ""
echo "3️⃣ Removendo link antigo e criando novo..."
sudo rm -f /etc/nginx/sites-enabled/ativafix
sudo rm -f /etc/nginx/sites-enabled/ativafix.conf
sudo ln -sf /etc/nginx/sites-available/ativafix.conf /etc/nginx/sites-enabled/ativafix.conf
echo "   ✅ Link criado"

echo ""
echo "4️⃣ Verificando sintaxe do Nginx..."
if sudo nginx -t; then
    echo "   ✅ Sintaxe OK"
else
    echo "   ❌ Erro de sintaxe!"
    sudo nginx -t 2>&1
    exit 1
fi

echo ""
echo "5️⃣ Garantindo que arquivos estão corretos..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

echo ""
echo "6️⃣ Limpando cache e reiniciando Nginx..."
sudo rm -rf /var/cache/nginx/*
sudo systemctl restart nginx
sleep 3

echo ""
echo "7️⃣ Verificando status..."
sudo systemctl status nginx --no-pager -l | head -5

echo ""
echo "8️⃣ Testando..."
echo "   Via HTTPS:"
curl -s -H "Cache-Control: no-cache" https://app.ativafix.com/ | grep -o 'assets/index-[^"]*\.js' | sort -u

echo ""
echo "✅ CONCLUÍDO!"
echo ""
echo "📋 TESTE NO NAVEGADOR:"
echo "   1. Feche TODAS as abas"
echo "   2. Abra janela anônima (Ctrl+Shift+N)"
echo "   3. Acesse: https://app.ativafix.com/integracoes"

