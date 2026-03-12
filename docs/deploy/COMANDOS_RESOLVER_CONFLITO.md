# 🔧 Resolver Conflito e Fazer Deploy

Execute no servidor:

## Opção 1: Script Automatizado (Recomendado)

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x RESOLVER_CONFLITO_E_DEPLOY.sh
./RESOLVER_CONFLITO_E_DEPLOY.sh
```

## Opção 2: Manual

```bash
cd /root/primecamp-ofc

# 1. Descartar mudanças locais
git checkout -- FORCAR_DEPLOY_COMPLETO.sh

# 2. Atualizar código
git pull origin main

# 3. Detectar diretório do Nginx
NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "/var/www/ativafix")

# 4. Fazer deploy
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r dist/* "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
sudo rm -rf /var/cache/nginx/*
sudo rm -rf /var/lib/nginx/cache/*
sudo systemctl reload nginx

echo "✅ Deploy concluído!"
```

Depois: Ctrl+Shift+R no navegador!
