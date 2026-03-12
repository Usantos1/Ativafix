#!/bin/bash

echo "🔧 CORRIGINDO CONFIGURAÇÃO DO NGINX - REMOVENDO ROOT DUPLICADO"
echo "=============================================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-enabled/ativafix.conf"
NGINX_ROOT="/var/www/ativafix"

echo "1️⃣ Fazendo backup da configuração atual..."
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup criado"
echo ""

echo "2️⃣ Verificando conteúdo atual do arquivo..."
echo "   Linhas com 'root':"
grep -n "root" "$NGINX_CONFIG" || echo "   Nenhuma linha 'root' encontrada"
echo ""

echo "3️⃣ Corrigindo configuração..."
# Criar um arquivo temporário com a configuração corrigida
TEMP_FILE=$(mktemp)

# Processar o arquivo linha por linha, mantendo apenas a primeira declaração root válida
ROOT_FOUND=0
while IFS= read -r line; do
    # Se encontrou uma linha root
    if echo "$line" | grep -qE "^\s*root\s+"; then
        # Se ainda não encontrou um root válido, manter esta linha
        if [ $ROOT_FOUND -eq 0 ]; then
            # Substituir por root correto
            echo "    root $NGINX_ROOT;" >> "$TEMP_FILE"
            ROOT_FOUND=1
        fi
        # Se já encontrou, pular esta linha (remover duplicatas)
    else
        # Mantém todas as outras linhas
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$NGINX_CONFIG"

# Verificar se encontrou algum root
if [ $ROOT_FOUND -eq 0 ]; then
    echo "   ⚠️ Nenhuma declaração root encontrada, adicionando..."
    # Se não encontrou nenhum root, adicionar na localização padrão
    sed -i '/location \/ {/a\        root '"$NGINX_ROOT"';' "$TEMP_FILE"
fi

# Copiar arquivo temporário para o lugar certo
sudo cp "$TEMP_FILE" "$NGINX_CONFIG"
rm "$TEMP_FILE"

echo "   ✅ Configuração corrigida"
echo ""

echo "4️⃣ Verificando se ficou correto..."
echo "   Linhas com 'root' agora:"
grep -n "root" "$NGINX_CONFIG"
ROOT_COUNT=$(grep -cE "^\s*root\s+" "$NGINX_CONFIG" || echo "0")
echo ""
echo "   Total de declarações 'root': $ROOT_COUNT"

if [ "$ROOT_COUNT" -gt 1 ]; then
    echo "   ⚠️ Ainda há múltiplas declarações root!"
    echo "   Verificando manualmente..."
    cat "$NGINX_CONFIG"
    exit 1
fi
echo ""

echo "5️⃣ Testando sintaxe do Nginx..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Sintaxe OK"
else
    echo "   ❌ Erro de sintaxe!"
    sudo nginx -t
    echo ""
    echo "   Restaurando backup..."
    sudo cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null || true
    exit 1
fi
echo ""

echo "6️⃣ Recarregando Nginx..."
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "   ✅ Nginx recarregado com sucesso"
else
    echo "   ❌ Erro ao recarregar Nginx"
    exit 1
fi
echo ""

echo "✅ CONFIGURAÇÃO CORRIGIDA!"
echo ""
echo "📋 Verificação final:"
grep -E "^\s*root\s+" "$NGINX_CONFIG"
echo ""
echo "   Agora teste acessando: https://app.ativafix.com/admin/configuracoes"
