# 🚀 Comandos de Deploy - Validações Obrigatórias

## ✅ Alterações Commitadas

1. `feat: tornar Previsão Entrega obrigatório e adicionar validação com feedback visual de campos obrigatórios`
2. `feat: consolidar validações obrigatórias com feedback visual e log no console`

## 📋 Campos Obrigatórios

- Cliente
- Telefone para contato
- Marca
- Modelo
- Descrição do problema
- Cor do equipamento *
- Condições do equipamento *
- Previsão de entrega * (NOVO)

* = Campos marcados com asterisco no formulário

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
3. Deve aparecer um toast com TODOS os campos faltando: "Preencha os seguintes campos: Cliente, Telefone, Marca, Modelo, Descrição do problema, Cor, Condições do equipamento, Previsão de entrega"
4. Abra o console do navegador (F12) e veja o log: `[VALIDAÇÃO OS] Campos obrigatórios faltando: [...]`
5. Preencha todos os campos e verifique se salva corretamente
