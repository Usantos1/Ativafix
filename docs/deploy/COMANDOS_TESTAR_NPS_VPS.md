# Comandos para Testar Correção NPS na VPS

## 🚀 Atualizar Backend e Reiniciar

```bash
# 1. Conectar na VPS
ssh usuario@seu-servidor

# 2. Ir para o diretório do backend
cd /root/primecamp-ofc

# 3. Buscar alterações do código
git pull origin main

# 4. Verificar se o arquivo server/index.js foi atualizado
grep -n "CORREÇÃO IMEDIATA" server/index.js

# 5. Reiniciar o servidor Node.js (PM2)
pm2 restart all
# OU se não usar PM2:
# pkill -f "node.*server" && cd /root/primecamp-ofc && node server/index.js &

# 6. Ver logs em tempo real
pm2 logs --lines 50
# OU se não usar PM2:
# tail -f /var/log/nodejs/server.log
```

## 🔍 Verificar Logs em Tempo Real (Durante o Teste)

```bash
# Em uma janela separada do terminal, execute:
pm2 logs --lines 0 --raw | grep -E "\[Update\]|allowed_respondents|target_employees|malformed|CORREÇÃO|FORÇA"

# OU se não usar PM2:
tail -f /var/log/nodejs/server.log | grep -E "\[Update\]|allowed_respondents|target_employees|malformed|CORREÇÃO|FORÇA"
```

## 🧪 Testar a Correção

1. Abra o navegador e acesse: https://app.ativafix.com
2. Vá para NPS > Gerenciar Pesquisas
3. Clique em editar uma pesquisa
4. Modifique os campos "Quem pode responder" ou "Sobre quem é a pesquisa"
5. Salve

## 📊 Verificar se Funcionou

```bash
# Ver últimas linhas dos logs
pm2 logs --lines 100 | tail -20

# Procurar por erros
pm2 logs --lines 200 | grep -i "error\|malformed\|❌"

# Ver se a correção foi aplicada
pm2 logs --lines 200 | grep -i "CORREÇÃO IMEDIATA\|FORÇA DESERIALIZAÇÃO"
```

## 🔧 Se Ainda Der Erro - Debug Avançado

```bash
# 1. Ver exatamente o que está chegando no servidor
pm2 logs --lines 0 --raw | grep -A 5 "Dados recebidos para nps_surveys"

# 2. Ver o valor final antes de executar a query
pm2 logs --lines 0 --raw | grep -A 3 "VALOR FINAL para allowed_respondents"

# 3. Ver o erro completo
pm2 logs --lines 0 --raw | grep -A 10 "malformed array literal"
```

## ⚡ Comando Rápido (Tudo em Uma Linha)

```bash
cd /root/primecamp-ofc && git pull origin main && pm2 restart all && echo "✅ Backend atualizado e reiniciado! Agora teste no navegador."
```

## 🐛 Se Precisar Ver o Código Atual

```bash
# Ver a função de correção
grep -A 20 "CORREÇÃO IMEDIATA" server/index.js

# Ver como arrays são processados
grep -A 10 "forceDeserializeArray" server/index.js

# Ver o cast UUID[]
grep -B 2 -A 2 "::uuid\[\]" server/index.js
```

## 📝 Checklist de Verificação

- [ ] Código atualizado (`git pull`)
- [ ] Servidor reiniciado (`pm2 restart`)
- [ ] Logs sendo monitorados
- [ ] Teste realizado no navegador
- [ ] Verificado se apareceu "CORREÇÃO IMEDIATA" nos logs
- [ ] Verificado se não apareceu "malformed array literal" nos logs
