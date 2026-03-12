# Comandos VPS - Rebuild Completo e Deploy

## 🔥 Problema
A rota `/admin/configuracoes/pagamentos` está dando 404, indicando que o build no servidor não tem a rota atualizada.

## ✅ Solução: Rebuild Completo

Execute na VPS:

```bash
cd /root/primecamp-ofc
git pull origin main
rm -rf dist node_modules/.vite node_modules/.cache .vite .cache
npm run build
sudo rm -rf /var/www/ativafix/*
sudo cp -r dist/* /var/www/ativafix/
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix
sudo rm -rf /var/cache/nginx/* /var/lib/nginx/cache/*
sudo systemctl reload nginx
```

## OU Use o Script

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x scripts/deploy/DEPLOY_FORCAR_REBUILD_SEM_CACHE.sh
./scripts/deploy/DEPLOY_FORCAR_REBUILD_SEM_CACHE.sh
```
*(Scripts na raiz foram movidos para `scripts/` — ver `docs/deploy/SCRIPTS-PATHS.md`.)*

## 🔍 Verificação

Após o deploy, verifique se a rota está no build:

```bash
grep -r "configuracoes/pagamentos" /var/www/ativafix/assets/*.js | head -3
```

Se aparecer resultados, a rota está no build. Se não, o build precisa ser refeito.
