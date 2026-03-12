# 🚀 Deploy - Sistema Completo de Movimentações de Estoque

## 📋 O que foi implementado:

- ✅ **Registro automático de movimentações** ao adicionar/editar/remover itens da OS
- ✅ **Devolução automática de estoque** ao remover item da OS
- ✅ **Registro de movimentações** ao finalizar vendas
- ✅ **Registro de movimentações** ao cancelar vendas
- ✅ **Registro de movimentações** ao editar produtos (estoque, preços)
- ✅ **Exibição melhorada** com data e hora completa
- ✅ **Tipos de movimentação**: Venda, OS, Cancelamento, Devolução, Devolução OS, Ajuste, Inventário, Troca, Perda
- ✅ **Informações completas**: Nome do usuário, data/hora, tipo, quantidade, descrição

---

## ⚡ Deploy Rápido (Uma Linha)

```bash
cd /root/primecamp-ofc && git pull origin main && npm run build && sudo rm -rf /var/www/ativafix/* && sudo cp -r dist/* /var/www/ativafix/ && sudo chown -R www-data:www-data /var/www/ativafix && sudo chmod -R 755 /var/www/ativafix && sudo rm -rf /var/cache/nginx/* && sudo systemctl restart nginx && echo "✅ Deploy concluído!"
```

---

## 📝 Deploy Manual (Passo a Passo)

### 1️⃣ Conectar na VPS e Atualizar Código

```bash
ssh usuario@seu-servidor
cd /root/primecamp-ofc
git pull origin main
```

### 2️⃣ Build do Frontend

```bash
cd /root/primecamp-ofc

# Instalar dependências (se necessário)
npm install

# Limpar build anterior
rm -rf dist

# Build do projeto
npm run build
```

### 3️⃣ Deploy no Nginx

```bash
# Limpar cache do Nginx
sudo rm -rf /var/cache/nginx/*
sudo find /var/cache/nginx -type f -delete 2>/dev/null || true

# Remover TODOS os arquivos antigos
sudo rm -rf /var/www/ativafix/*
sudo rm -rf /var/www/ativafix/.*

# Copiar novos arquivos
sudo cp -r dist/* /var/www/ativafix/

# Ajustar permissões
sudo chown -R www-data:www-data /var/www/ativafix
sudo chmod -R 755 /var/www/ativafix

# Testar configuração do Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## ✅ Funcionalidades Implementadas

### 📊 Aba Movimentações no Produto

A aba "Movimentações" agora mostra:

1. **Data e Hora Completa**: Data formatada (dd/MM/yyyy) e hora (HH:mm:ss)
2. **Tipo de Movimentação**: Badge colorido por tipo
   - 🔵 Venda (azul)
   - 🟣 OS (roxo)
   - 🟠 Cancelamento (laranja)
   - 🟢 Devolução (verde)
   - 🟢 Devolução OS (verde esmeralda)
   - 🟡 Troca (amarelo)
   - 🔴 Perda (vermelho)
   - ⚪ Ajuste (cinza)
   - 🟦 Inventário (índigo)
3. **Referência**: Número da OS/Venda (clicável para abrir)
4. **Quantidade**: Delta da movimentação (+/-)
5. **Descrição**: Detalhes da movimentação
6. **Responsável**: Nome do usuário que fez a operação

### 🔄 Operações que Registram Movimentações

1. **Adicionar item na OS**: Baixa estoque e registra como "OS"
2. **Editar item na OS**: Ajusta estoque e registra movimentação
3. **Remover item da OS**: Devolve estoque e registra como "Devolução OS"
4. **Finalizar venda**: Baixa estoque e registra como "Venda"
5. **Cancelar venda**: Devolve estoque e registra como "Cancelamento"
6. **Editar produto**: Registra ajustes de estoque/preço como "Ajuste"
7. **Inventário**: Registra como "Inventário"
8. **Devoluções**: Registra como "Devolução", "Troca" ou "Perda"

---

## 🧪 Como Testar

1. **Adicionar item na OS:**
   - Abrir uma OS
   - Adicionar uma peça
   - Verificar que o estoque foi baixado
   - Abrir o produto → Aba Movimentações
   - Deve aparecer: "OS #X" com quantidade negativa

2. **Remover item da OS:**
   - Remover um item de peça da OS
   - Verificar que o estoque foi devolvido
   - Abrir o produto → Aba Movimentações
   - Deve aparecer: "Devolução OS #X" com quantidade positiva

3. **Finalizar venda:**
   - Criar e finalizar uma venda com produtos
   - Abrir um produto vendido → Aba Movimentações
   - Deve aparecer: "Venda #X" com quantidade negativa

4. **Cancelar venda:**
   - Cancelar uma venda finalizada
   - Abrir o produto → Aba Movimentações
   - Deve aparecer: "Cancelamento #X" com quantidade positiva

5. **Editar produto:**
   - Editar quantidade ou preço de um produto
   - Abrir o produto → Aba Movimentações
   - Deve aparecer: "Ajuste" com os valores antes/depois

---

## 📋 Checklist Pós-Deploy

- [ ] Código atualizado (`git pull` executado)
- [ ] Build do frontend concluído sem erros
- [ ] Arquivos copiados para `/var/www/ativafix/`
- [ ] Nginx reiniciado
- [ ] Cache do navegador limpo
- [ ] Testado adicionar item na OS → verificar movimentação
- [ ] Testado remover item da OS → verificar devolução
- [ ] Testado finalizar venda → verificar movimentação
- [ ] Testado cancelar venda → verificar cancelamento
- [ ] Testado editar produto → verificar ajuste
- [ ] Verificado que todas as movimentações mostram:
  - [ ] Data e hora corretas
  - [ ] Nome do usuário responsável
  - [ ] Tipo correto de movimentação
  - [ ] Quantidade delta correta
  - [ ] Descrição detalhada

---

**Commit:** 614f5f0 - feat: implementar sistema completo de log de movimentações de estoque
