# Comandos VPS - Corrigir Tree-Shaking do Vite

## 🔧 Problema Identificado

O código fonte estava correto, mas o Vite estava fazendo **tree-shaking** e removendo `showAlreadyAppliedModal` e `AlreadyAppliedModal` do build porque:

- `AlreadyAppliedModal` estava definido **DEPOIS** dos returns condicionais (`if (loading)`, `if (!survey)`, `if (submitted)`)
- O bundler analisava estaticamente e considerava que esse código nunca seria alcançado
- Resultado: código removido do build compilado

## ✅ Solução

`AlreadyAppliedModal` foi movido para **ANTES** dos returns condicionais, garantindo que o bundler o inclua no build.

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

Ou use o script:

```bash
cd /root/primecamp-ofc && git pull origin main && chmod +x scripts/verify/VERIFICAR_E_CORRIGIR_DEPLOY.sh && ./scripts/verify/VERIFICAR_E_CORRIGIR_DEPLOY.sh
```

## 📋 Após o Deploy

1. Feche TODAS as abas do ativafix
2. Use modo anônimo (Ctrl+Shift+N)
3. Acesse: https://app.ativafix.com/vaga/Aux-tecnico

Agora `showAlreadyAppliedModal` deve estar no build compilado!
