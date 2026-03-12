# Página de vendas – ativafix.com

**Não use esta pasta para deploy.**

A landing de vendas em produção é a **LP em React**: `src/pages/landing/LandingPage.tsx`.  
O build do front (Vite) gera um único pacote; em **ativafix.com** e **www.ativafix.com** o mesmo app carrega e, pelo hostname, exibe a LP em vez do sistema.

- **ativafix.com** / **www.ativafix.com** → LP (hero, dores, recursos, CTA WhatsApp).
- **app.ativafix.com** → sistema (login, dashboard, OS, etc.).

No Nginx, **ativafix.com** e **app.ativafix.com** devem usar o **mesmo** `root` (ex.: `/var/www/primecamp.cloud`). Não aponte ativafix.com para outra pasta (ex.: `/var/www/ativafix-lp` ou cópia de `landing/`), senão aparece página “em construção” ou estática em vez da LP em React.

O arquivo `landing/index.html` é um HTML estático antigo, mantido só como referência. Para alterar a LP, edite `src/pages/landing/LandingPage.tsx` e faça o deploy normal (build + copiar `dist/*` para `/var/www/primecamp.cloud`). Ver `docs/deploy/COMANDO_DEPLOY_VPS_UMA_LINHA.md` e `docs/deploy/NGINX_ATIVAFIX_PASSO_A_PASSO.md`.
