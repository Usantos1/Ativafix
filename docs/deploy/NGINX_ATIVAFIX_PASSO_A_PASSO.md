# Nginx Ativa FIX – Passo a passo pelo terminal

Execute os comandos **na VPS** (SSH). Domínios: **ativafix.com** (LP/vendas), **app.ativafix.com** (sistema), **api.ativafix.com** (API).

---

## 1. Conferir se o Nginx está instalado

```bash
nginx -v
```

Se não estiver: `sudo apt update && sudo apt install -y nginx`

---

## 2. Criar pasta do frontend (se ainda não existir)

```bash
sudo mkdir -p /var/www/ativafix
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix
```

*(O deploy do frontend vai copiar o build para essa pasta. Se você já usa `/var/www/primecamp.cloud`, pode continuar usando – no passo 4 troque `ativafix` por `primecamp.cloud` no `root`.)*

---

## 3. Parar o Nginx para o Certbot (só na primeira vez)

```bash
sudo systemctl stop nginx
```

---

## 4. Gerar certificado SSL (Let’s Encrypt)

**Primeira vez** (ainda não tem certificado para esses domínios):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d ativafix.com -d www.ativafix.com -d app.ativafix.com -d api.ativafix.com --agree-tos -m SEU_EMAIL@dominio.com --non-interactive
```

**Se já existe certificado** (ex.: só ativafix.com, www, api) e você quer **incluir app.ativafix.com**, use `--expand`:

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone --expand -d ativafix.com -d www.ativafix.com -d app.ativafix.com -d api.ativafix.com --agree-tos -m SEU_EMAIL@dominio.com --non-interactive
sudo systemctl start nginx
```

*(Troque `SEU_EMAIL@dominio.com` pelo seu e-mail.)*

---

## 5. Subir o Nginx de novo

```bash
sudo systemctl start nginx
```

---

## 6. Criar o arquivo de configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/ativafix
```

**Apague tudo** que estiver no arquivo e **cole o bloco abaixo inteiro**. Depois ajuste:

- **root:** se o seu frontend fica em `/var/www/primecamp.cloud`, troque `/var/www/ativafix` por `/var/www/primecamp.cloud` nos dois blocos que têm `root`.
- **ssl_certificate / ssl_certificate_key:** se o Certbot tiver gerado em outro caminho, use `ls /etc/letsencrypt/live/` e ajuste o nome da pasta.

```nginx
# =========================
# HTTP → HTTPS (todos os hostnames)
# =========================
server {
    listen 80;
    listen [::]:80;
    server_name ativafix.com www.ativafix.com app.ativafix.com api.ativafix.com;
    return 301 https://$host$request_uri;
}

# =========================
# ativafix.com – LP / páginas de vendas (HTTPS)
# =========================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ativafix.com www.ativafix.com;

    root /var/www/ativafix;
    index index.html;

    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header X-Content-Type-Options "nosniff";
    }

    ssl_certificate /etc/letsencrypt/live/ativafix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ativafix.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# =========================
# app.ativafix.com – Sistema (login, dashboard, OS, etc.) (HTTPS)
# =========================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.ativafix.com;

    root /var/www/ativafix;
    index index.html;

    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header X-Content-Type-Options "nosniff";
    }

    ssl_certificate /etc/letsencrypt/live/ativafix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ativafix.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# =========================
# api.ativafix.com – API Node (HTTPS)
# =========================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.ativafix.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }

    ssl_certificate /etc/letsencrypt/live/ativafix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ativafix.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

Salvar no nano: **Ctrl+O**, Enter, **Ctrl+X**.

---

## 7. Se o Certbot criou arquivo em outro caminho

Listar certificados:

```bash
sudo ls /etc/letsencrypt/live/
```

Se aparecer algo como `ativafix.com` (e não outro nome), o config acima está certo. Se o nome for outro (ex.: `app.ativafix.com`), no nano troque:

- `live/ativafix.com` → `live/NOME_QUE_APARECEU`

---

## 8. Ativar o site e testar a configuração

```bash
sudo ln -sf /etc/nginx/sites-available/ativafix /etc/nginx/sites-enabled/
sudo nginx -t
```

Se aparecer `syntax is ok` e `test is successful`, recarregar:

```bash
sudo systemctl reload nginx
```

---

## 9. (Opcional) Desativar o site antigo

Se você tinha um config só para `primecamp.cloud` ou outro arquivo que conflita com os mesmos `server_name`, desative:

```bash
sudo rm -f /etc/nginx/sites-enabled/primecamp.cloud
sudo nginx -t && sudo systemctl reload nginx
```

*(Só faça isso se tiver certeza; senão pule.)*

---

## 10. Conferir se está respondendo

```bash
curl -sI https://ativafix.com        | head -1
curl -sI https://app.ativafix.com    | head -1
curl -sI https://api.ativafix.com/api/health | head -1
```

Todos devem retornar `HTTP/2 200` (ou 301 no primeiro, se houver redirect). Para ver o corpo do health:

```bash
curl -s https://api.ativafix.com/api/health
```

---

## 11. Renovação automática do SSL (já costuma estar ativa)

```bash
sudo certbot renew --dry-run
```

Se passar, o cron do certbot já renova sozinho.

---

## Resumo dos domínios

| Domínio           | Uso                          | root / proxy              |
|-------------------|------------------------------|---------------------------|
| ativafix.com      | LP e páginas de vendas       | `root /var/www/ativafix`  |
| app.ativafix.com  | Sistema (login, dashboard…)   | `root /var/www/ativafix`  |
| api.ativafix.com  | API (Node na porta 3000)     | `proxy_pass :3000`        |

Se o deploy do frontend jogar os arquivos em `/var/www/primecamp.cloud`, use esse path no `root` nos blocos de ativafix.com e app.ativafix.com.
