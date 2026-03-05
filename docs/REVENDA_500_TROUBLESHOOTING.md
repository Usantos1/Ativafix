# Revenda — Erro 500 ao criar empresa ou listar planos

## O que foi corrigido

1. **Transação ao criar empresa** — O backend passou a usar um único client do pool para BEGIN/INSERT/COMMIT, evitando falha por uso de conexões diferentes.
2. **Assinatura anual** — Se o plano não tiver `price_yearly`, o valor usado passa a ser `price_monthly * 12`.
3. **Script SQL** — No script de instalação, os triggers foram alterados de `EXECUTE FUNCTION` para `EXECUTE PROCEDURE` (compatível com mais versões do PostgreSQL).
4. **Resposta de erro** — Em desenvolvimento, a API devolve `error` e opcionalmente `detail` no JSON de erro 500 para facilitar o diagnóstico.

## Se o erro 500 continuar

### 1. Ver a mensagem real do erro

- Abra as **Ferramentas do desenvolvedor** (F12) → aba **Rede (Network)**.
- Tente de novo **Criar** empresa ou abrir **Gerenciar Planos**.
- Clique na requisição que retornou **500** (por exemplo `companies` ou `plans`).
- Em **Resposta (Response)** ou **Preview**, veja o corpo da resposta: o campo `error` (e, se existir, `detail`) traz a mensagem do banco ou do servidor.

### 2. Só falta `company_id` na tabela `users` (erro 503)

Se a API responder **503** com mensagem sobre "estrutura do banco" ou "company_id", execute apenas o fix:

```bash
psql -U seu_usuario -d seu_banco -f db/migrations/manual/REVENDA_FIX_users_company_id.sql
```

Ou no DBeaver/pgAdmin: abra e execute o arquivo `db/migrations/manual/REVENDA_FIX_users_company_id.sql`.

### 3. Reexecutar o script completo (após a correção dos triggers)

Se ainda não rodou o script principal ou quiser garantir tudo:

```bash
psql -U seu_usuario -d seu_banco -f db/migrations/manual/INSTALAR_SISTEMA_REVENDA_COMPLETO.sql
```

Ou abra o arquivo no DBeaver/pgAdmin e execute.

### 4. Conferir se as tabelas e o admin existem

No PostgreSQL:

```sql
-- Tabelas do sistema de revenda
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('companies', 'plans', 'subscriptions');

-- Empresa admin e planos
SELECT id, name, email FROM companies WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT id, name, code, price_monthly, price_yearly FROM plans;
```

- Deve existir a empresa admin e pelo menos um plano.
- Se a tabela `users` tiver coluna `company_id`, o usuário admin deve estar vinculado à empresa admin:

```sql
SELECT u.id, u.email, u.company_id, p.role
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'seu_email_admin';
```

O `company_id` deve ser `00000000-0000-0000-0000-000000000001` e o `role` deve ser `admin`.

### 5. Erros comuns

| Mensagem / Sintoma | O que fazer |
|--------------------|-------------|
| `relation "plans" does not exist` | Rodar o script SQL completo (cria `companies`, `plans`, `subscriptions`). |
| `relation "companies" does not exist` | Idem. |
| `column "company_id" does not exist` (em `users`) | O script adiciona `company_id` em `users`; garantir que esse trecho do script foi executado sem erro. |
| Token inválido / 403 | Fazer login de novo; conferir se o usuário é admin da empresa principal. |

Depois de reexecutar o script e conferir os pontos acima, teste de novo em **Nova Empresa** e **Gerenciar Planos**. Se ainda der 500, use a resposta da API (campo `error`/`detail`) para identificar a linha ou constraint que está falhando.
