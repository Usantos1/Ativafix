#!/bin/bash

echo "🚀 DEPLOY COMPLETO COM LIMPEZA DE CACHE"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do projeto na VPS
PROJECT_DIR="/root/primecamp-ofc"
NGINX_WEB_ROOT="/var/www/ativafix"

cd "$PROJECT_DIR" || { echo -e "${RED}❌ Erro: Diretório $PROJECT_DIR não encontrado.${NC}"; exit 1; }

# 1. Atualizar código
echo -e "${YELLOW}1️⃣ Atualizando código do repositório...${NC}"
git pull origin main || { echo -e "${RED}❌ Erro ao fazer pull do código.${NC}"; exit 1; }
echo -e "${GREEN}✅ Código atualizado.${NC}"

# 2. Instalar dependências do backend
echo -e "${YELLOW}2️⃣ Instalando dependências do backend...${NC}"
cd "$PROJECT_DIR"/server || { echo -e "${RED}❌ Erro: Diretório server não encontrado.${NC}"; exit 1; }
npm install || { echo -e "${RED}❌ Erro ao instalar dependências do backend.${NC}"; exit 1; }
echo -e "${GREEN}✅ Dependências do backend instaladas.${NC}"

# 3. Reiniciar backend
echo -e "${YELLOW}3️⃣ Reiniciando backend...${NC}"
pm2 restart primecamp-api || { echo -e "${RED}❌ Erro ao reiniciar backend.${NC}"; exit 1; }
sleep 5
pm2 status
echo -e "${GREEN}✅ Backend reiniciado.${NC}"

# 4. Build do frontend
echo -e "${YELLOW}4️⃣ Fazendo build do frontend...${NC}"
cd "$PROJECT_DIR" || { echo -e "${RED}❌ Erro: Diretório do projeto não encontrado.${NC}"; exit 1; }
npm install || { echo -e "${RED}❌ Erro ao instalar dependências do frontend.${NC}"; exit 1; }

# Limpar build anterior
rm -rf dist
echo -e "${GREEN}✅ Build anterior removido.${NC}"

npm run build || { echo -e "${RED}❌ Erro no build do frontend!${NC}"; exit 1; }
echo -e "${GREEN}✅ Build do frontend concluído.${NC}"

# 5. Limpar cache do Nginx ANTES de copiar
echo -e "${YELLOW}5️⃣ Limpando cache do Nginx...${NC}"
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true
sudo find /var/cache/nginx -type f -delete 2>/dev/null || true
echo -e "${GREEN}✅ Cache do Nginx limpo.${NC}"

# 6. Remover arquivos antigos COMPLETAMENTE
echo -e "${YELLOW}6️⃣ Removendo arquivos antigos do Nginx...${NC}"
sudo rm -rf "$NGINX_WEB_ROOT"/* 2>/dev/null || true
sudo rm -rf "$NGINX_WEB_ROOT"/.* 2>/dev/null || true
sleep 1
echo -e "${GREEN}✅ Arquivos antigos removidos.${NC}"

# 7. Deploy do frontend
echo -e "${YELLOW}7️⃣ Copiando arquivos do frontend para o Nginx...${NC}"
sudo cp -r dist/* "$NGINX_WEB_ROOT"/ || { echo -e "${RED}❌ Erro ao copiar arquivos do frontend.${NC}"; exit 1; }
sudo chown -R www-data:www-data "$NGINX_WEB_ROOT" 2>/dev/null || true
sudo chmod -R 755 "$NGINX_WEB_ROOT" 2>/dev/null || true
echo -e "${GREEN}✅ Arquivos do frontend copiados.${NC}"

# 8. Recarregar Nginx (sem restart para não derrubar conexões)
echo -e "${YELLOW}8️⃣ Recarregando Nginx...${NC}"
sudo nginx -t || { echo -e "${RED}❌ Erro na configuração do Nginx!${NC}"; exit 1; }
sudo systemctl reload nginx || { echo -e "${RED}❌ Erro ao recarregar Nginx.${NC}"; exit 1; }
echo -e "${GREEN}✅ Nginx recarregado.${NC}"

# 9. Verificar logs do backend
echo -e "${YELLOW}9️⃣ Verificando logs do backend (últimas 30 linhas)...${NC}"
pm2 logs primecamp-api --lines 30 --nostream 2>&1 | tail -35

echo ""
echo -e "${GREEN}🎉 DEPLOY COMPLETO FINALIZADO!${NC}"
echo ""
echo "📋 PRÓXIMOS PASSOS IMPORTANTES:"
echo "1. Limpe o cache do navegador:"
echo "   - Chrome/Edge: Ctrl+Shift+Delete → Limpar dados de navegação → Cache"
echo "   - Ou pressione Ctrl+Shift+R (Cmd+Shift+R no Mac) para hard refresh"
echo "2. Faça LOGOUT e LOGIN novamente no sistema"
echo "3. Teste criar uma nova OS e verifique:"
echo "   - Campos obrigatórios (Cor e Condições do Equipamento)"
echo "   - Navegação automática para checklist"
echo "   - ID da OS sendo retornado corretamente"
echo ""
echo "⚠️  Se ainda não funcionar, tente:"
echo "   - Abrir em janela anônima/privada"
echo "   - Verificar console do navegador (F12)"
echo ""
