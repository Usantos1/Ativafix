# 🚀 Comandos VPS - Fix Scrollbar + Remover Warning

## ✅ CORREÇÕES APLICADAS:

1. **Scrollbar mais visível** - Opacidade aumentada de 0.3 para 0.4, com borda sutil
2. **Removido plugin obsoleto** - `@tailwindcss/line-clamp` removido (já incluído no Tailwind v3.3+)

## 📋 DEPLOY RÁPIDO:

```bash
cd /root/primecamp-ofc
chmod +x DEPLOY_SCROLLBAR_FIX.sh
./DEPLOY_SCROLLBAR_FIX.sh
```

## 📋 DEPLOY MANUAL:

```bash
# 1. Atualizar código
cd /root/primecamp-ofc
git pull origin main

# 2. Atualizar browserslist (opcional)
npx update-browserslist-db@latest

# 3. Build
npm run build

# 4. Deploy
NGINX_ROOT="/var/www/ativafix"  # ou "/var/www/html"
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r dist/* "$NGINX_ROOT"/
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

# 5. Limpar cache
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*
sudo systemctl reload nginx
```

## ⚠️ IMPORTANTE:

**Após o deploy, faça HARD REFRESH no navegador:**
- **Windows/Linux:** `Ctrl+Shift+R` ou `Ctrl+F5`
- **Mac:** `Cmd+Shift+R`

O scrollbar agora está **mais visível** mas ainda **discreto** (8px, opacidade 0.4).
