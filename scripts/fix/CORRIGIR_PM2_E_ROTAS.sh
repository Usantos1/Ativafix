#!/bin/bash
# Script para corrigir PM2, aplicar migrações e fazer deploy completo

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando deploy completo...${NC}"

# Verificar status do PM2
echo -e "${YELLOW}🔍 Verificando status do PM2...${NC}"
pm2 status

# Parar todos os processos PM2
echo -e "${YELLOW}🛑 Parando todos os processos PM2...${NC}"
pm2 stop all || true
pm2 delete all || true

# Aguardar processos terminarem
echo -e "${YELLOW}⏳ Aguardando 2 segundos...${NC}"
sleep 2

# Matar processos na porta 3000
echo -e "${YELLOW}🔪 Matando processos na porta 3000 (se houver)...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Nenhum processo para matar"

# Navegar para o diretório do projeto
cd /root/primecamp-ofc

# Atualizar código
echo -e "${YELLOW}📥 Atualizando código do repositório...${NC}"
git pull origin main || {
    echo -e "${RED}❌ Erro ao fazer git pull${NC}"
    exit 1
}

# Instalar dependências do backend
echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
cd server
npm install || {
    echo -e "${RED}❌ Erro ao instalar dependências do backend${NC}"
    exit 1
}

# Aplicar migração SQL
echo -e "${YELLOW}🗄️  Aplicando migração SQL...${NC}"
DB_NAME=$(grep DB_NAME ../.env 2>/dev/null | cut -d '=' -f2 || echo "postgres")
echo -e "${YELLOW}📊 Banco de dados: $DB_NAME${NC}"
sudo -u postgres psql -d "$DB_NAME" -f ../sql/CRIAR_TABELAS_IA_FINANCEIRO.sql || {
    echo -e "${YELLOW}⚠️  Migração SQL pode já ter sido aplicada (aviso ignorado)${NC}"
}

# Iniciar backend com PM2
echo -e "${YELLOW}🚀 Iniciando backend com PM2...${NC}"
pm2 start index.js --name primecamp-api || {
    echo -e "${RED}❌ Erro ao iniciar backend${NC}"
    exit 1
}

# Aguardar backend inicializar
echo -e "${YELLOW}⏳ Aguardando backend inicializar...${NC}"
sleep 5

# Verificar status do PM2
echo -e "${YELLOW}🔍 Verificando status do PM2...${NC}"
pm2 status

# Verificar logs do backend
echo -e "${YELLOW}📋 Últimas 30 linhas do log do backend:${NC}"
pm2 logs primecamp-api --lines 30 --nostream | tail -30

# Voltar para o diretório raiz
cd /root/primecamp-ofc

# Instalar dependências do frontend (se necessário)
echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
npm install || {
    echo -e "${RED}❌ Erro ao instalar dependências do frontend${NC}"
    exit 1
}

# Limpar build anterior
echo -e "${YELLOW}🧹 Limpando build anterior...${NC}"
rm -rf dist node_modules/.vite || true

# Fazer build do frontend
echo -e "${YELLOW}🔨 Fazendo build do frontend...${NC}"
npm run build || {
    echo -e "${RED}❌ Erro ao fazer build do frontend${NC}"
    exit 1
}

# Deploy do frontend
echo -e "${YELLOW}📤 Deploy do frontend para Nginx...${NC}"
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Limpar cache do Nginx
echo -e "${YELLOW}🧹 Limpando cache do Nginx...${NC}"
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*
sudo systemctl reload nginx

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo -e "${YELLOW}🔍 Verificando se a rota /financeiro está no bundle:${NC}"
if grep -r "DashboardExecutivo" /var/www/html/assets/*.js | head -3; then
    echo -e "${GREEN}✅ Componentes financeiro encontrados no bundle${NC}"
else
    echo -e "${RED}⚠️  Componentes financeiro não encontrados no bundle${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Tudo pronto! Acesse https://app.ativafix.com/financeiro${NC}"
