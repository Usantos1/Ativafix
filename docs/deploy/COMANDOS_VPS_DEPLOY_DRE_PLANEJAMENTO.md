# Comandos para Deploy do DRE e PlanejamentoAnual no VPS

Este script irá:
1. Navegar para o diretório do projeto no servidor.
2. Puxar as últimas alterações do repositório `main`.
3. Fazer build do frontend.
4. Copiar os arquivos para o diretório do Nginx.
5. Limpar cache do Nginx.
6. Recarregar o Nginx.

```bash
# 1. Navegar para o diretório raiz do projeto
cd /root/primecamp-ofc

# 2. Puxar as últimas alterações do repositório
echo "🚀 Puxando as últimas alterações do repositório..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Erro ao puxar as alterações. Verifique sua conexão ou permissões."
    exit 1
fi
echo "✅ Código atualizado."

# 3. Fazer build do frontend
echo ""
echo "📦 Fazendo build do frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build!"
    exit 1
fi
echo "✅ Build concluído."

# 4. Detectar diretório do Nginx
echo ""
echo "📁 Detectando diretório do Nginx..."
NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "")
if [ -z "$NGINX_ROOT" ]; then
  NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-enabled/ativafix* 2>/dev/null | grep "root" | head -1 | awk '{print $2}' | sed 's/;//' || echo "")
fi
if [ -z "$NGINX_ROOT" ]; then
  NGINX_ROOT="/var/www/ativafix"
fi

echo "📁 Diretório do Nginx: $NGINX_ROOT"

if [ ! -d "$NGINX_ROOT" ]; then
  sudo mkdir -p "$NGINX_ROOT"
fi

# 5. Limpar diretório do Nginx
echo ""
echo "🧹 Limpando diretório do Nginx..."
sudo rm -rf "$NGINX_ROOT"/*
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true
sudo rm -rf /var/lib/nginx/cache/* 2>/dev/null || true

# 6. Copiar arquivos do dist/ para $NGINX_ROOT
echo ""
echo "📋 Copiando arquivos do dist/ para $NGINX_ROOT..."
sudo cp -r dist/* "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

# 7. Recarregar Nginx
echo ""
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://app.ativafix.com/financeiro/dre"
echo "💡 No navegador: Ctrl+Shift+R (hard refresh para limpar cache)"
```

## Comandos Rápidos (uma linha)

Se preferir executar tudo de uma vez:

```bash
cd /root/primecamp-ofc && git pull origin main && npm run build && NGINX_ROOT=$(sudo grep -A 5 "server_name ativafix" /etc/nginx/sites-available/ativafix 2>/dev/null | grep "root" | awk '{print $2}' | sed 's/;//' || echo "/var/www/ativafix") && sudo rm -rf "$NGINX_ROOT"/* && sudo cp -r dist/* "$NGINX_ROOT/" && sudo chown -R www-data:www-data "$NGINX_ROOT" && sudo systemctl reload nginx && echo "✅ Deploy concluído!"
```

## Verificar se o deploy funcionou

```bash
# Verificar se os arquivos foram copiados
ls -lh /var/www/ativafix/ | head -20

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar status do Nginx
sudo systemctl status nginx
```

## Notas

- **Cache do navegador:** Sempre faça um hard refresh (Ctrl+Shift+R) após o deploy
- **Build time:** O build pode levar 1-2 minutos dependendo do servidor
- **Permissões:** Os arquivos precisam estar com permissões corretas (www-data:www-data)
- **Nginx:** Se houver erro, verifique os logs com `sudo tail -f /var/log/nginx/error.log`
