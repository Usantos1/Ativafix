#!/bin/bash

echo "🔧 CORRIGIR NGINX PARA SPA (React Router)"
echo "=========================================="
echo ""

# Verificar configuração atual do Nginx
echo "1. Verificando configuração atual do Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/default"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "⚠️  Arquivo $NGINX_CONFIG não encontrado"
    echo "   Procurando outras configurações..."
    NGINX_CONFIG=$(find /etc/nginx -name "*.conf" -o -name "*primecamp*" | head -1)
    if [ -z "$NGINX_CONFIG" ]; then
        echo "❌ Nenhuma configuração do Nginx encontrada!"
        exit 1
    fi
    echo "   Usando: $NGINX_CONFIG"
fi

echo "✅ Configuração encontrada: $NGINX_CONFIG"

# Verificar se já tem try_files
if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
    echo "✅ Nginx já está configurado para SPA"
else
    echo "⚠️  Nginx NÃO está configurado para SPA"
    echo ""
    echo "2. Criando backup da configuração..."
    sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup criado"
    
    echo ""
    echo "3. Adicionando configuração SPA..."
    
    # Criar configuração temporária
    TEMP_CONFIG=$(mktemp)
    
    # Ler configuração atual e modificar
    sudo cat "$NGINX_CONFIG" | sed 's|location / {|location / {\n        try_files $uri $uri/ /index.html;|' > "$TEMP_CONFIG"
    
    # Se não funcionou, tentar método alternativo
    if ! grep -q "try_files.*index.html" "$TEMP_CONFIG"; then
        # Método mais agressivo - adicionar após location /
        sudo awk '/location \/ \{/ {print; print "        try_files $uri $uri/ /index.html;"; next}1' "$NGINX_CONFIG" > "$TEMP_CONFIG"
    fi
    
    # Aplicar configuração
    sudo mv "$TEMP_CONFIG" "$NGINX_CONFIG"
    echo "✅ Configuração atualizada"
fi

# Verificar sintaxe
echo ""
echo "4. Verificando sintaxe do Nginx..."
if sudo nginx -t; then
    echo "✅ Sintaxe OK"
else
    echo "❌ ERRO na sintaxe do Nginx!"
    echo "   Restaurando backup..."
    sudo cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null || true
    exit 1
fi

# Recarregar Nginx
echo ""
echo "5. Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado"

# Verificar se está rodando
echo ""
echo "6. Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está rodando"
else
    echo "❌ ERRO: Nginx não está rodando!"
    sudo systemctl start nginx
fi

echo ""
echo "========================================"
echo "✅ NGINX CONFIGURADO PARA SPA!"
echo "========================================"
echo ""
echo "Agora teste: https://app.ativafix.com/test-auth"
echo ""



