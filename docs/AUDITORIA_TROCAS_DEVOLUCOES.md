# Auditoria: Sistema de Trocas e Devoluções

## 1. Estado atual do sistema

### 1.1 Acesso e permissões
- **Rota:** `/pdv/devolucoes` — exige permissão `vendas.manage`.
- **Processar devolução (criar):** apenas usuários com `canProcessRefund`:
  - `isAdmin` OU
  - `profile.role === 'admin' | 'manager' | 'gestor'`
- **Efeito:** vendedores com `vendas.manage` entram na página, mas ao tentar processar recebem *"Apenas administradores ou gestores podem processar devoluções"*.

### 1.2 Fluxo de devolução
1. **Criar** → `createRefund()` → API `POST /refunds` → devolução criada com `status: 'pending'`.
2. **Aprovar** → `approveRefund(id)` → API `PUT /refunds/:id/approve` → `status: 'approved'`, preenche `approved_by`, `approved_at`.
3. **Completar** → `completeRefund(id)` → API `PUT /refunds/:id/complete` → `status: 'completed'`, estorno de estoque, preenche `completed_by`, `completed_at`.
4. **Cancelar** → `cancelRefund(id, reason)` → API `PUT /refunds/:id/cancel`.

### 1.3 Tipos e destinos
- **Refund method:** `voucher` | `cash` | `original` (estorno pelo meio original).
- **Destino do produto (refund_items):** `stock` | `exchange` | `loss` (UI em Devolucoes.tsx: Estoque, Troca, Prejuízo).
- **Vale compra:** gerado quando `refund_method === 'voucher'`; cliente obrigatório (Consumidor Final só pode devolução em dinheiro).

### 1.4 Onde está no código
| Arquivo | Responsabilidade |
|--------|-------------------|
| `src/pages/pdv/Devolucoes.tsx` | Página principal: buscar venda, itens, criar devolução, listar refunds/vouchers, aprovar/completar |
| `src/hooks/useRefunds.ts` | Chamadas à API: createRefund, approveRefund, completeRefund, cancelRefund, checkVoucher, useVoucher |
| `src/components/pdv/RefundDialog.tsx` | Dialog alternativo de devolução (usado em outro fluxo; step select → confirm → complete) |
| `db/.../CRIAR_SISTEMA_DEVOLUCAO_E_PAGAMENTOS.sql` | Tabelas: refunds, refund_items, vouchers, voucher_usage |
| `db/.../CRIAR_SEQUENCIAS_REFUNDS.sql` | Sequência refund_number_seq, generate_voucher_code() |

### 1.5 Banco de dados (refunds)
- `refunds`: status (pending, approved, completed, cancelled), approved_by, approved_at, completed_by, completed_at, cancel_reason.
- Backend (API) é quem persiste; front só chama os endpoints.

---

## 2. Gaps e riscos

1. **Vendedor não consegue operar sozinho**  
   Só admin/gestor processa. Não há “senha de aprovação” para um supervisor liberar no caixa.

2. **Aprovar/Completar sem segundo fator**  
   Quem é admin/gestor aprova e completa sem senha nem confirmação extra.

3. **Sem limite de valor para aprovação por senha**  
   Não há regra do tipo “até R$ X o vendedor aprova com senha; acima disso só admin”.

4. **Sem auditoria de “quem aprovou com senha”**  
   Se no futuro houver senha, é importante registrar que a aprovação foi feita via senha (e opcionalmente por qual usuário digitou).

5. **RefundDialog vs Devolucoes**  
   Dois fluxos de criação (RefundDialog em um contexto, formulário em Devolucoes em outro); garantir que ambos respeitem as mesmas regras de permissão e senha.

---

## 3. Ideias para liberar vendedores com senha de admin

### 3.1 Objetivo
- Vendedor (ou qualquer um com `vendas.manage`) pode **criar** devolução/troca/vale (status `pending`).
- **Aprovar** e **Completar** exigem **senha de aprovação** (exceto se for admin/gestor, que pode continuar sem senha).
- Quem digita a senha correta pode aprovar/completar mesmo sendo vendedor.

### 3.2 Onde guardar a senha
- **Opção A (recomendada):** tabela de configuração por empresa, ex.: `company_settings` ou `refund_config`:
  - `approval_password_hash` (bcrypt/argon2), ou
  - `approval_password_enabled` (boolean) + hash.
- **Opção B:** campo em `companies` (menos flexível).
- Nunca armazenar senha em texto plano. Validação no **backend** (API).

### 3.3 Fluxo proposto

1. **Criar devolução**  
   - Permitir para quem tem `vendas.manage` (incluindo vendedores).  
   - Remover o bloqueio `canProcessRefund` apenas para a ação de **criar**.  
   - Devolução criada sempre como `pending`.

2. **Aprovar**  
   - Se usuário for admin/gestor/manager: pode aprovar direto (como hoje).  
   - Senão: ao clicar em “Aprovar”, abrir **modal “Senha de aprovação”**.  
   - Front envia para API: `PUT /refunds/:id/approve` com body `{ approval_password: "xxx" }`.  
   - Backend: se senha configurada, valida o hash; se ok, aprova e registra (ex.: `approved_via_password: true` ou campo similar).  
   - Se não houver senha configurada: só aceita se o usuário for admin/gestor.

3. **Completar**  
   - Mesma lógica: admin/gestor completa direto; outros usuários informam a senha no modal; API valida e completa.

4. **Configuração da senha (admin)**  
   - Em Configurações (ex.: “Devoluções e Trocas” ou dentro de PDV/Vendas):  
     - Checkbox “Exigir senha para aprovar devoluções (vendedores)”.  
     - Campo “Senha de aprovação” (salvo em hash no backend).  
   - Se desmarcado ou vazio: comportamento atual (só admin/gestor aprova e completa).

### 3.4 Extras úteis (fase 2)

- **Limite por valor:** até R$ X qualquer um com senha aprova; acima, só admin.
- **Auditoria:** log de “Devolução #X aprovada por [usuário] com senha de aprovação” (e opcionalmente completed_by quando completar).
- **Troca vs devolução:** hoje já existe “destino” (estoque/troca/prejuízo). Podemos exibir labels “Troca” / “Devolução” / “Vale” conforme tipo e destino, e aplicar a mesma regra de senha para aprovar/completar.
- **Vale compra:** mesma senha para aprovar a devolução que gera o vale; uso do vale no PDV pode permanecer como está (quem tem permissão de venda usa o vale).

---

## 4. Plano de implementação sugerido

### 4.1 Backend (API)
- [ ] Endpoint de config (ex.: GET/PUT ` /company/refund-settings` ou dentro de config geral) para salvar:
  - `approval_password_required: boolean`
  - `approval_password_hash: string` (ou só hash quando required).
- [ ] `PUT /refunds/:id/approve`: aceitar body `{ approval_password?: string }`.  
  - Se `approval_password_required` e usuário não for admin/gestor: validar senha; se ok, aprovar e gravar approved_by (e opcionalmente flag “approved_with_password”).  
  - Se senha não obrigatória ou usuário for admin/gestor: aprovar sem senha.
- [ ] `PUT /refunds/:id/complete`: mesma lógica com `approval_password`.
- [ ] Não expor o hash da senha no GET de config; apenas indicar “senha definida” (boolean).

### 4.2 Frontend (este repositório)
- [ ] **Devolucoes.tsx**
  - Permitir **criar** devolução para quem tem `vendas.manage` (remover bloqueio de `canProcessRefund` só na criação).
  - Manter ou ajustar: botões “Aprovar” e “Completar” visíveis para quem tem acesso à página.
  - Ao clicar em “Aprovar” ou “Completar”: se usuário **não** for admin/gestor/manager, abrir **modal** “Digite a senha de aprovação”; senão, chamar approve/complete direto.
  - Modal: campo senha, botão Confirmar; ao confirmar, chamar API com `approval_password`.
- [ ] **useRefunds.ts**
  - `approveRefund(id, options?: { approval_password?: string })`.
  - `completeRefund(id, options?: { approval_password?: string })`.
  - Enviar `approval_password` no body quando informado.
- [ ] **Configurações**
  - Nova seção “Devoluções e Trocas” (ou em PDV): ativar “Exigir senha para vendedores aprovarem” + campo “Senha de aprovação” (e confirmação). Chamar API de config para salvar (hash no backend).

### 4.3 Banco (se a config for em tabela nova)
- [ ] Exemplo: `refund_approval_config (company_id, require_password boolean, password_hash text, updated_at, updated_by)`.

---

## 5. Resumo

| Item | Hoje | Proposta |
|------|------|----------|
| Quem acessa /pdv/devolucoes | vendas.manage | Igual |
| Quem pode **criar** devolução | Só admin/gestor/manager | Qualquer um com vendas.manage (vendedor inclusive) |
| Quem pode **aprovar** | Só admin/gestor (sem senha) | Admin/gestor direto; outros com **senha de aprovação** |
| Quem pode **completar** | Só admin/gestor (sem senha) | Admin/gestor direto; outros com **senha de aprovação** |
| Onde fica a senha | — | Config por empresa, só hash no backend |
| Auditoria | approved_by, completed_by | Manter; opcional: flag “approved_with_password” |

Com isso, o vendedor consegue fazer toda a operação de troca/devolução/vale no caixa, e a efetivação (aprovar + completar) fica condicionada à senha de admin que você configurar, podendo ser digitada por um supervisor no momento do atendimento.

---

## 6. Implementado no frontend (este repositório)

- **Criar devolução:** qualquer usuário com acesso à página (`vendas.manage`) pode criar; o bloqueio “só admin/gestor” foi removido apenas para a **criação**.
- **Aprovar / Completar:**  
  - Se o usuário for admin/gestor/manager → aprova/completa direto (sem senha).  
  - Se for vendedor (ou outro perfil) → ao clicar em “Aprovar” ou “Completar” abre o **modal “Senha de aprovação”**; o valor digitado é enviado no body da API (`approval_password`) em `PUT /refunds/:id/approve` e `PUT /refunds/:id/complete`.
- **Hook useRefunds:** `approveRefund(id, { approval_password })` e `completeRefund(id, { approval_password })` passam o parâmetro para a API.

Para a senha realmente validar, o **backend** precisa:
1. Aceitar `approval_password` no body desses PUTs.
2. Ter uma config (por empresa) com o hash da senha e validar antes de aprovar/completar.
3. Opcional: tela em Configurações para o admin definir a “Senha para aprovar devoluções”.
