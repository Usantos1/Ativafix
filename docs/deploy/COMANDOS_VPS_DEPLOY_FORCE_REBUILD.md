# Comandos VPS - Deploy Forçado (Rebuild Completo)

## 🚨 Problema

O build em produção não está atualizado. O erro `showAlreadyAppliedModal is not defined` persiste porque o código compilado ainda é o antigo (`index-XK54N--J.js`).

## ✅ Solução

Fazer um deploy FORÇADO com rebuild completo, limpando TODOS os caches.

## Execute no VPS:

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x scripts/deploy/DEPLOY_FRONTEND_PROD_FORCE_REBUILD.sh
./scripts/deploy/DEPLOY_FRONTEND_PROD_FORCE_REBUILD.sh
```

Ou manualmente:

```bash
cd /root/primecamp-ofc
git pull origin main

# Limpar TODOS os caches
rm -rf dist node_modules/.vite node_modules/.cache .vite .vite-build

# Build completo (sem cache)
npm run build

# Limpar Nginx
sudo rm -rf /var/www/ativafix/*
sudo rm -rf /var/cache/nginx/* /var/lib/nginx/cache/*

# Copiar build
sudo cp -r dist/* /var/www/ativafix/
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix

# Reiniciar Nginx
sudo systemctl stop nginx
sleep 1
sudo systemctl start nginx
sleep 1
sudo systemctl reload nginx

# Verificar se showAlreadyAppliedModal está no build
grep -r "showAlreadyAppliedModal" /var/www/ativafix/assets/*.js | head -1
```

## 📋 Após o Deploy

1. **Feche TODAS as abas** do `ativafix`
2. **Use modo anônimo** (Ctrl+Shift+N no Chrome/Edge)
3. **Ou limpe o cache** do navegador (Ctrl+Shift+Delete)
4. Acesse: `https://app.ativafix.com/vaga/Aux-tecnico`

## 🔍 Verificação

O script verifica automaticamente se `showAlreadyAppliedModal` está presente no build. Se não estiver, isso indica um problema no código fonte (mas o código está correto no repositório).

## ⚠️ Se o erro persistir

1. Verifique o hash do arquivo JS no navegador (DevTools > Network > index-*.js)
2. Se o hash for `XK54N--J`, o build NÃO foi atualizado
3. Execute novamente o script de deploy
4. Verifique se há erros durante o `npm run build`
