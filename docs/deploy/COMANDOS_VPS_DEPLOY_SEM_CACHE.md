# Comandos VPS - Deploy Forçando Rebuild Sem Cache

## 🔥 Problema
O card "Formas de Pagamento e Taxas" aparece em localhost mas não na VPS. Isso indica cache do Vite/build ou do Nginx.

## ✅ Solução: Rebuild Completo Sem Cache

Execute no VPS:

```bash
cd /root/primecamp-ofc
git pull origin main
rm -rf dist node_modules/.vite node_modules/.cache .vite .cache
npm run build
sudo rm -rf /var/www/ativafix/*
sudo cp -r dist/* /var/www/ativafix/
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix
sudo rm -rf /var/cache/nginx/* /var/lib/nginx/cache/* /tmp/nginx_cache/*
sudo systemctl reload nginx
```

## OU Use o Script Automatizado

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x scripts/deploy/DEPLOY_FORCAR_REBUILD_SEM_CACHE.sh
./scripts/deploy/DEPLOY_FORCAR_REBUILD_SEM_CACHE.sh
```

## 🔍 O que o script faz:

1. **Atualiza código** do repositório
2. **Remove todos os caches do Vite:**
   - `node_modules/.vite`
   - `node_modules/.cache`
   - `.vite`
   - `.cache`
   - `dist/` (pasta de build)
3. **Força rebuild completo** (sem usar cache)
4. **Limpa diretório do Nginx** completamente
5. **Copia novos arquivos** compilados
6. **Ajusta permissões**
7. **Limpa cache do Nginx** (todas as pastas possíveis)
8. **Recarrega Nginx**

## 📋 Depois do Deploy

Teste em uma janela anônima do navegador para evitar cache do navegador:
- Chrome/Edge: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

Ou limpe o cache do navegador completamente.
