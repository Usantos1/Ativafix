# 🔧 Comandos para RECUPERAR o Sistema na VPS

## ⚠️ IMPORTANTE: Execute na ordem

### 1️⃣ Verificar qual é o diretório correto do Nginx

```bash
# Verificar configuração do Nginx
sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix | grep "root"
```

### 2️⃣ Verificar se o build existe

```bash
cd /root/primecamp-ofc
ls -la dist/
```

### 3️⃣ Se o build NÃO existe, fazer build primeiro

```bash
cd /root/primecamp-ofc
npm run build
```

### 4️⃣ Detectar e usar o diretório CORRETO do Nginx

```bash
cd /root/primecamp-ofc

# Detectar diretório do Nginx
NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "")
if [ -z "$NGINX_ROOT" ]; then
  NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-enabled/ativafix* 2>/dev/null | grep "root" | head -1 | awk '{print $2}' | sed 's/;//' || echo "")
fi
if [ -z "$NGINX_ROOT" ]; then
  NGINX_ROOT="/var/www/ativafix"
fi

echo "📁 Diretório do Nginx detectado: $NGINX_ROOT"

# Criar diretório se não existir
sudo mkdir -p "$NGINX_ROOT"

# Verificar se dist existe
if [ ! -d "dist" ]; then
  echo "❌ Erro: dist/ não existe! Execute 'npm run build' primeiro"
  exit 1
fi

# Limpar cache do Nginx
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true

# Limpar diretório do Nginx (CUIDADO!)
sudo rm -rf "$NGINX_ROOT"/* 2>/dev/null || true

# Aguardar um segundo
sleep 1

# Copiar arquivos do build
sudo cp -r dist/* "$NGINX_ROOT/" 2>/dev/null || {
  echo "❌ Erro ao copiar arquivos!"
  exit 1
}

# Ajustar permissões
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

echo "✅ Sistema recuperado!"
```

## 🚨 Se ainda não funcionar, verificar logs

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Ver status do Nginx
sudo systemctl status nginx

# Verificar se os arquivos foram copiados
ls -la /var/www/ativafix/
# ou
ls -la /var/www/html/
```
