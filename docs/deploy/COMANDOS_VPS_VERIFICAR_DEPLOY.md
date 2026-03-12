# Comandos VPS - Verificar e Corrigir Deploy (Diagnóstico Completo)

## 🔍 Script de Diagnóstico Completo

Este script verifica **TUDO** e mostra exatamente onde está o problema:

1. ✅ Verifica se código fonte está correto
2. ✅ Remove build antigo
3. ✅ Faz build novo
4. ✅ **VERIFICA se showAlreadyAppliedModal está no build compilado**
5. ✅ Verifica estado atual do Nginx
6. ✅ Limpa Nginx
7. ✅ Copia arquivos
8. ✅ **VERIFICA se showAlreadyAppliedModal está no Nginx APÓS cópia**
9. ✅ Limpa cache e recarrega Nginx

## Execute no VPS:

```bash
cd /root/primecamp-ofc
git pull origin main
chmod +x scripts/verify/VERIFICAR_E_CORRIGIR_DEPLOY.sh
./scripts/verify/VERIFICAR_E_CORRIGIR_DEPLOY.sh
```

## O que o script faz diferente

O script verifica **duas vezes**:
- Antes de copiar: verifica se está no `dist/`
- Depois de copiar: verifica se está no Nginx

Se alguma verificação falhar, o script **para** e mostra exatamente onde está o problema.

## 📋 Após o Script

Se o script mostrar "✅ CONFIRMADO: showAlreadyAppliedModal está no Nginx", então:

1. Feche TODAS as abas do ativafix
2. Use modo anônimo (Ctrl+Shift+N)
3. Acesse: https://app.ativafix.com/vaga/Aux-tecnico

Se ainda assim o erro persistir, então há algo mais profundo (talvez cache do CDN, ou problema no processo de build do Vite).
