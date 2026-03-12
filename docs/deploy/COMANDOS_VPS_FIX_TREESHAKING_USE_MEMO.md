# Comandos VPS - Corrigir Tree-Shaking com useMemo

## 🔧 Problema

O Vite estava removendo `AlreadyAppliedModal` do build mesmo após mover antes dos returns condicionais.

## ✅ Solução

Agora `AlreadyAppliedModal` está envolvido em `useMemo` para garantir que seja incluído no build.

## Execute no VPS:

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

Depois verifique:

```bash
cd /root/primecamp-ofc && chmod +x scripts/verify/VERIFICAR_BUILD_FINAL.sh && ./scripts/verify/VERIFICAR_BUILD_FINAL.sh
```

Agora `showAlreadyAppliedModal` deve estar no build!
