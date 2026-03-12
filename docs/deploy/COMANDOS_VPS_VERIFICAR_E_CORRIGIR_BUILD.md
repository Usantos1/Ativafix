# Comandos VPS - Verificar e Corrigir Build

## 🔍 Verificar se o Build Inclui o Código Corrigido

Execute no VPS para verificar se o código foi compilado corretamente:

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x VERIFICAR_BUILD_SERVIDOR.sh
./VERIFICAR_BUILD_SERVIDOR.sh
```

## 🔧 Se o Script Mostrar Erro: Rebuild Completo

Se o script mostrar que `showAlreadyAppliedModal` não está no build compilado, execute:

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

## 📋 Verificação Manual Rápida

Para verificar rapidamente se o código está no build:

```bash
cd /root/primecamp-ofc
# Verificar código fonte
grep -n "showAlreadyAppliedModal.*useState" src/pages/JobApplicationSteps.tsx

# Verificar build compilado (deve mostrar resultados)
grep -r "showAlreadyAppliedModal" dist/ | head -3

# Verificar arquivos no Nginx (deve mostrar resultados)
grep -r "showAlreadyAppliedModal" /var/www/ativafix/ 2>/dev/null | head -3
```

## Comando Completo (Copiar e Colar)

```bash
cd /root/primecamp-ofc && git pull origin main && chmod +x VERIFICAR_BUILD_SERVIDOR.sh && ./VERIFICAR_BUILD_SERVIDOR.sh
```
