# Comandos VPS - Forçar Rebuild Completo

## 🔥 Script que Força Rebuild e Verifica

Este script:
1. ✅ Atualiza código do Git
2. ✅ Verifica se código fonte está correto
3. ✅ Remove TUDO (dist, cache, node_modules/.vite)
4. ✅ Faz build novo
5. ✅ **VERIFICA se showAlreadyAppliedModal está no build compilado**
6. ✅ Copia para Nginx
7. ✅ **VERIFICA se showAlreadyAppliedModal está no Nginx**
8. ✅ Limpa cache e recarrega Nginx

## Execute:

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x DEPLOY_FORCAR_REBUILD_COMPLETO.sh
./DEPLOY_FORCAR_REBUILD_COMPLETO.sh
```

## Ou em uma linha:

```bash
cd /root/primecamp-ofc && git pull origin main && chmod +x DEPLOY_FORCAR_REBUILD_COMPLETO.sh && ./DEPLOY_FORCAR_REBUILD_COMPLETO.sh
```

## ⚠️ Se o script mostrar ERRO

Se o script mostrar:
- `❌ ERRO CRÍTICO: showAlreadyAppliedModal NÃO está no build compilado!`

Isso significa que há um problema com o código fonte ou com o processo de build. O script irá mostrar onde está o problema.

## 📋 Após o Deploy

No navegador:
1. Feche TODAS as abas do ativafix
2. Ctrl+Shift+Delete → Limpar cache completamente
3. OU use modo anônimo (Ctrl+Shift+N)
4. Acesse: https://app.ativafix.com/vaga/atendente-cs
