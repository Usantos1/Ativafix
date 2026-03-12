# 🚀 Comandos de Deploy - Cabeçalho Fixo na Tabela de Clientes

## ✅ Alteração Commitada

`feat: tornar cabeçalho da tabela de clientes fixo (sticky) durante scroll`

## 📋 Comandos para Deploy na VPS

```bash
cd /root/primecamp-ofc
git pull origin main
npm install
npm run build
sudo rm -rf /var/cache/nginx/* /var/www/ativafix/* /var/www/ativafix/.*
sleep 1
sudo cp -r dist/* /var/www/ativafix/
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix
sudo nginx -t
sudo systemctl reload nginx
```

## 🧪 Como Testar

1. Limpe o cache do navegador (`Ctrl + Shift + R`)
2. Acesse a página de Clientes (`/clientes`)
3. Role a página para baixo
4. Verifique que o cabeçalho da tabela (Nome, CPF/CNPJ, RG, Telefone, Email, Cidade, Ações) permanece fixo no topo
5. Apenas as linhas de clientes devem rolar, enquanto o cabeçalho permanece visível

## 🔧 O que foi alterado

- **TableHeader**: Adicionado `sticky top-0 z-10 bg-background` para:
  - `sticky`: Permite que o elemento fique fixo durante o scroll
  - `top-0`: Posiciona no topo do container
  - `z-10`: Garante que fique acima do conteúdo que rola
  - `bg-background`: Adiciona fundo para cobrir o conteúdo que passa embaixo

## 🎯 Objetivo

Melhorar a experiência do usuário mantendo o cabeçalho da tabela visível durante o scroll, facilitando a identificação das colunas mesmo quando há muitos clientes na lista.
