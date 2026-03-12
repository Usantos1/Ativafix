# 🚀 Comandos para Deploy - Implementações Parte 1-6

## 📋 Resumo das Implementações

✅ **PARTE 1**: Estrutura de vendas (PDV/OS) - campos `sale_origin`, `technician_id`, `cashier_user_id`  
✅ **PARTE 2**: Produto x Serviço - diferenciação em `sale_items`  
✅ **PARTE 3**: Relatórios e Indicadores - resumo geral e produtividade por técnico  
✅ **PARTE 4**: Checklist automático + Impressão OS em 2 vias  
✅ **PARTE 5**: Impressão automática PDV  
✅ **PARTE 6**: Melhorias UI/UX - bordas, contrastes, fontes

---

## 🚀 Deploy Rápido (Recomendado)

### Conectar na VPS e executar:

```bash
ssh usuario@seu-servidor

cd /root/primecamp-ofc

# Dar permissão de execução (primeira vez)
chmod +x DEPLOY_PARTE_1_6_VPS.sh

# Executar deploy
./DEPLOY_PARTE_1_6_VPS.sh
```

---

## 📝 Passo a Passo Manual

### 1️⃣ Conectar na VPS

```bash
ssh usuario@seu-servidor
```

### 2️⃣ Atualizar Código

```bash
cd /root/primecamp-ofc
git pull origin main
```

### 3️⃣ Aplicar Migrações SQL (IMPORTANTE!)

**⚠️ FAÇA BACKUP DO BANCO ANTES!**

```bash
# Opção 1: Via psql
sudo -u postgres psql -d seu_banco -f ADD_SALE_ORIGIN_MIGRATION.sql
sudo -u postgres psql -d seu_banco -f ADD_OS_PRINT_FIELDS_MIGRATION.sql
sudo -u postgres psql -d seu_banco -f ADD_SALES_PRINT_FIELDS_MIGRATION.sql

# Opção 2: Via pgAdmin ou outro cliente gráfico
# Abra cada arquivo .sql e execute na ordem:
# 1. ADD_SALE_ORIGIN_MIGRATION.sql
# 2. ADD_OS_PRINT_FIELDS_MIGRATION.sql
# 3. ADD_SALES_PRINT_FIELDS_MIGRATION.sql
```

### 4️⃣ Deploy do Backend

```bash
cd /root/primecamp-ofc/server

# Instalar dependências (se necessário)
npm install

# Reiniciar backend
pm2 restart primecamp-api

# Verificar status
pm2 status
pm2 logs primecamp-api --lines 30
```

### 5️⃣ Deploy do Frontend

```bash
cd /root/primecamp-ofc

# Instalar dependências (se necessário)
npm install

# Build
npm run build

# Copiar para Nginx
sudo rm -rf /var/www/ativafix/*
sudo cp -r dist/* /var/www/ativafix/

# Recarregar Nginx
sudo systemctl reload nginx
```

### 6️⃣ Verificar Deploy

```bash
# Verificar backend
curl https://api.ativafix.com/api/health

# Verificar frontend
curl -I https://app.ativafix.com

# Ver logs do backend
pm2 logs primecamp-api --lines 50
```

---

## 📋 Arquivos de Migração

Aplique **NA ORDEM**:

1. **ADD_SALE_ORIGIN_MIGRATION.sql**
   - Adiciona `sale_origin`, `technician_id`, `cashier_user_id` na tabela `sales`
   - Migra dados existentes

2. **ADD_OS_PRINT_FIELDS_MIGRATION.sql**
   - Adiciona `printed_at`, `print_status`, `print_attempts` na tabela `ordens_servico`

3. **ADD_SALES_PRINT_FIELDS_MIGRATION.sql**
   - Adiciona `printed_at`, `print_status`, `print_attempts` na tabela `sales`

---

## ✅ Checklist Pré-Deploy

- [ ] Backup do banco de dados criado
- [ ] Código testado localmente
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] Espaço em disco disponível
- [ ] Serviços (PM2, Nginx) funcionando

---

## 🐛 Troubleshooting

### Erro ao aplicar migração SQL

```bash
# Verificar permissões
sudo -u postgres psql -d seu_banco -c "SELECT current_user;"

# Verificar se as tabelas existem
sudo -u postgres psql -d seu_banco -c "\dt sales"
sudo -u postgres psql -d seu_banco -c "\dt ordens_servico"
```

### Build do frontend falha

```bash
# Limpar cache e reinstalar
rm -rf node_modules dist
npm cache clean --force
npm install
npm run build
```

### Backend não inicia

```bash
# Ver logs
pm2 logs primecamp-api --lines 50

# Verificar porta
sudo netstat -tlnp | grep :3000
```

### Frontend não carrega

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar configuração
sudo nginx -t

# Verificar permissões
ls -la /var/www/ativafix
```

---

## 🎯 Próximos Passos Após Deploy

1. **Limpar cache do navegador** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Fazer logout e login** novamente
3. **Testar funcionalidades**:
   - Criar uma nova venda (PDV)
   - Criar uma OS e verificar checklist automático
   - Finalizar venda e verificar impressão automática
   - Acessar relatórios em `/pdv/relatorios`
   - Verificar melhorias visuais na UI

---

**Data**: $(date)
