# 🚀 Comandos de Deploy - Correção do Toast (Toaster)

## ✅ Alteração Commitada

`fix: adicionar Toaster de volta para exibir toasts do useToast hook`

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
2. Tente salvar uma OS sem preencher campos obrigatórios
3. Deve aparecer um toast/notificação vermelho no canto da tela listando todos os campos faltando
4. O toast deve fechar automaticamente após alguns segundos

## 🔧 O que foi corrigido

O componente `<Toaster />` do shadcn/ui foi adicionado de volta ao App.tsx para que os toasts do hook `useToast()` sejam renderizados corretamente. Antes, apenas o `<Sonner />` estava renderizado, o que fazia com que os toasts do `useToast()` não aparecessem visualmente.
