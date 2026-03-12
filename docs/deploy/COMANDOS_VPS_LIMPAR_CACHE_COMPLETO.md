# Comandos VPS - Deploy Frontend com Limpeza Completa de Cache

## ⚠️ Problema
O erro `showAlreadyAppliedModal is not defined` persiste mesmo após limpar cache do navegador. Isso indica que pode ser cache do Vite/build ou do Nginx.

## 🔥 Solução: Rebuild Completo com Limpeza de Cache

Execute no VPS:

```bash
cd /root/primecamp-ofc
git pull origin main
rm -rf dist node_modules/.vite node_modules/.cache .vite
npm run build
sudo rm -rf /var/www/ativafix/*
sudo cp -r dist/* /var/www/ativafix/
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix
sudo rm -rf /var/cache/nginx/* /var/lib/nginx/cache/*
sudo systemctl reload nginx
```

## OU Use o Script Automatizado

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x DEPLOY_FRONTEND_LIMPAR_CACHE_COMPLETO.sh
./DEPLOY_FRONTEND_LIMPAR_CACHE_COMPLETO.sh
```

## 🧹 No Navegador (IMPORTANTE)

Após o deploy:

1. **Feche TODAS as abas do ativafix**
2. **Limpe o cache completamente:**
   - Chrome/Edge: `Ctrl + Shift + Delete` → Marque "Imagens e arquivos em cache" → "Todo o período" → Limpar dados
   - Firefox: `Ctrl + Shift + Delete` → Marque "Cache" → "Tudo" → Limpar agora
3. **OU use modo anônimo/privado:**
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
4. Acesse: https://app.ativafix.com/vaga/atendente-cs

## Comando Completo (Copiar e Colar)

```bash
cd /root/primecamp-ofc && git pull origin main && rm -rf dist node_modules/.vite node_modules/.cache .vite && npm run build && sudo rm -rf /var/www/ativafix/* && sudo cp -r dist/* /var/www/ativafix/ && sudo chown -R www-data:www-data /var/www/ativafix && sudo chmod -R 755 /var/www/ativafix && sudo rm -rf /var/cache/nginx/* /var/lib/nginx/cache/* && sudo systemctl reload nginx && echo "✅ Deploy completo! Agora limpe o cache do navegador completamente (Ctrl+Shift+Delete)"
```
