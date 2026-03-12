# 🔧 Correção: Nome do Banco de Dados

O script estava tentando usar o banco "banco_gestao" que não existe.

## ✅ SOLUÇÃO RÁPIDA

### 1. Descobrir o nome correto do banco:

```bash
# Listar todos os bancos
sudo -u postgres psql -l

# OU verificar no .env
grep DB_NAME .env
```

### 2. Aplicar migração manualmente com o nome correto:

```bash
# Substitua NOME_DO_BANCO pelo nome real
sudo -u postgres psql -d NOME_DO_BANCO -f sql/CRIAR_TABELAS_IA_FINANCEIRO.sql
```

### 3. Continuar o deploy:

```bash
cd /root/primecamp-ofc/server
npm install
pm2 restart primecamp-api
cd ..
npm install
npm run build
sudo rm -rf /var/cache/nginx/* /var/www/ativafix/* /var/www/ativafix/.*
sleep 2
sudo cp -r dist/* /var/www/ativafix/
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔄 Script Corrigido

O script foi corrigido para detectar automaticamente o nome do banco do arquivo `.env`.

Para usar a versão corrigida:
```bash
cd /root/primecamp-ofc
git pull origin main
./DEPLOY_IA_FINANCEIRO.sh
```
