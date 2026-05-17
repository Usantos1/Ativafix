# Guia Para Cliente: Como Configurar Seu Domínio No Ativa FIX

Este guia mostra como apontar um domínio próprio para o Ativa FIX.

Exemplos:

- `app.suaempresa.com.br`
- `sistema.suaempresa.com.br`
- `gestao.suaempresa.com.br`

O acesso padrão por `app.ativafix.com` continua funcionando normalmente.

## Antes De Começar

Você precisa ter acesso ao painel onde o DNS do seu domínio é gerenciado.

O domínio personalizado precisa estar liberado no plano contratado. Cada empresa pode usar 1 domínio próprio no Ativa FIX.

Exemplos de painéis:

- Cloudflare
- Registro.br
- GoDaddy
- HostGator
- Hostinger
- Locaweb
- cPanel da hospedagem

Se você não souber onde o DNS do seu domínio é gerenciado, envie este guia para o responsável pelo domínio ou hospedagem.

## Passo 1: Escolher O Endereço

Escolha qual endereço quer usar para acessar o Ativa FIX.

Recomendamos uma destas opções:

```text
app.seudominio.com.br
sistema.seudominio.com.br
gestao.seudominio.com.br
```

Exemplo:

```text
app.primecamp.com.br
```

Não use endereço com caminho.

Errado:

```text
app.seudominio.com.br/login
```

Certo:

```text
app.seudominio.com.br
```

## Passo 2: Enviar O Domínio Para O Suporte

Envie para o suporte do Ativa FIX o domínio escolhido.

Exemplo:

```text
Quero usar app.primecamp.com.br no Ativa FIX.
```

O suporte vai cadastrar esse domínio no painel da sua empresa.

## Passo 3: Criar O Registro CNAME

No painel DNS do seu domínio, crie ou edite o registro:

```text
Tipo: CNAME
Nome: app
Destino: custom.ativafix.com
TTL: Automático
Proxy: Somente DNS, se estiver usando Cloudflare
```

Se você escolheu `sistema.seudominio.com.br`, use:

```text
Tipo: CNAME
Nome: sistema
Destino: custom.ativafix.com
TTL: Automático
Proxy: Somente DNS, se estiver usando Cloudflare
```

Se você escolheu `gestao.seudominio.com.br`, use:

```text
Tipo: CNAME
Nome: gestao
Destino: custom.ativafix.com
TTL: Automático
Proxy: Somente DNS, se estiver usando Cloudflare
```

## Importante Sobre Cloudflare

No Cloudflare, deixe a nuvem como cinza:

```text
Somente DNS
```

Não deixe como:

```text
Com proxy
```

Depois que tudo estiver validado, o suporte do Ativa FIX poderá orientar se é possível ativar proxy.

## Passo 4: Criar O TXT De Verificação

O suporte também pode pedir para criar um registro TXT de verificação.

Exemplo:

```text
Tipo: TXT
Nome: _ativafix.app.seudominio.com.br
Valor: ativa-fix-verification=TOKEN_GERADO
TTL: Automático
```

O valor exato do token deve ser copiado do painel do Ativa FIX.

## Passo 5: Aguardar Propagação

Após alterar DNS, aguarde alguns minutos.

Normalmente leva:

```text
1 a 15 minutos
```

Em alguns provedores pode levar mais tempo.

## Passo 6: Verificar Com O Suporte

Avise o suporte do Ativa FIX depois de configurar.

O suporte vai clicar em `Verificar` no painel do Ativa FIX.

Quando estiver tudo certo, o status ficará:

```text
Status: Ativo
SSL: Ativo
```

## Passo 7: Acessar O Sistema

Depois de ativado, acesse:

```text
https://app.seudominio.com.br
```

Exemplo:

```text
https://app.primecamp.com.br
```

O login será o mesmo usado no Ativa FIX.

## Problemas Comuns

### Erro: Já Existe Um Registro Com Esse Nome

Se ao criar o CNAME aparecer erro dizendo que já existe registro `A`, `AAAA` ou `CNAME` com o mesmo nome, edite ou remova o registro antigo.

Exemplo:

Se já existe:

```text
A app 177.93.107.23
```

Troque para:

```text
CNAME app custom.ativafix.com
```

Não pode existir `A app` e `CNAME app` ao mesmo tempo.

### Ainda Abre O Site Antigo

Pode ser cache DNS.

Teste em:

```text
https://dnschecker.org
```

Procure pelo seu domínio usando o tipo `A` ou `CNAME`.

Também teste em outra rede, como 4G do celular.

### Aparece Aviso De Certificado

Avise o suporte. O SSL é emitido automaticamente depois que o domínio aponta corretamente para o Ativa FIX.

### O Login Abre Mas Não Entra

Confirme se o usuário pertence à empresa correta no Ativa FIX.

Por segurança, usuário de outra empresa não consegue acessar pelo domínio personalizado.

## Mensagem Para Enviar Ao Responsável Pelo DNS

Você pode copiar e enviar esta mensagem:

```text
Olá!

Precisamos apontar o domínio do sistema para o Ativa FIX.

Por favor, crie/edite o seguinte registro DNS:

Tipo: CNAME
Nome: app
Destino: custom.ativafix.com
TTL: Automático
Proxy: Somente DNS, caso use Cloudflare

Não pode existir outro registro A, AAAA ou CNAME com o nome app.

Depois de salvar, avise para validarmos no Ativa FIX.
```

Se o endereço escolhido for `sistema.seudominio.com.br`, troque `Nome: app` por:

```text
Nome: sistema
```

Se for `gestao.seudominio.com.br`, troque por:

```text
Nome: gestao
```
