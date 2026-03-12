# 🚀 Comandos de Deploy - Aumento de Espessura de Bordas

## ✅ Alteração Commitada

`feat: aumentar espessura de bordas e linhas para melhor legibilidade (3px)`

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
2. Navegue pelas diferentes páginas do sistema
3. Verifique que todas as bordas e linhas estão mais espessas e visíveis:
   - Tabelas (linhas de cabeçalho e células)
   - Cards
   - Inputs
   - Textareas
   - Selects
   - Botões outline
   - Dialogs/Modais
   - Separadores

## 🔧 O que foi alterado

- **Table**: Bordas de cabeçalho aumentadas para 3px, bordas de células para 2px
- **Card**: Bordas aumentadas de 2px para 3px, cor mais escura (gray-400)
- **Input**: Bordas aumentadas de 2px para 3px, cor mais escura (gray-400)
- **Textarea**: Bordas aumentadas de 2px para 3px, cor mais escura (gray-400)
- **Select**: Bordas aumentadas de 2px para 3px, cor mais escura (gray-400)
- **Button (outline)**: Bordas aumentadas de 2px para 3px, cor mais escura (gray-400)
- **Dialog**: Bordas aumentadas de 2px para 3px, cor mais escura (gray-400)
- **Separator**: Altura aumentada de 2px para 3px, cor mais escura (gray-400)

## 🎯 Objetivo

Melhorar a legibilidade do sistema aumentando a espessura e visibilidade de todas as linhas e bordas, tornando mais fácil visualizar os elementos da interface.
