# 🔑 Guia de Uso do Token de API - PrimeCamp

## 📋 Informações Básicas

**URL Base:** `https://api.ativafix.com/api/v1`  
**Autenticação:** Bearer Token  
**Header:** `Authorization: Bearer <seu_token>`

## 🚀 Como Usar o Token

### 1. Obter o Token

1. Acesse: `https://app.ativafix.com/integracoes`
2. Vá na aba "API Externa"
3. Clique em "Novo Token"
4. Preencha:
   - **Nome:** Ex: "AI Agent", "Chatbot", etc.
   - **Descrição:** Descrição do uso
   - **Permissões:** Selecione as permissões necessárias
   - **Expiração:** (Opcional) Data de expiração
5. Clique em "Criar"
6. **COPIE O TOKEN** - ele só será mostrado uma vez!

### 2. Usar o Token nas Requisições

O token deve ser enviado no header `Authorization` de todas as requisições:

```
Authorization: Bearer 33db39d91ff563f1b71a8f026392ef3f1a281bb9d58b296de514083e98fba123
```

## 📚 Endpoints Disponíveis

### GET /produtos
Buscar produtos com filtros

**Parâmetros de Query:**
- `busca` - Busca geral (descrição, código, referência, código de barras)
- `modelo` - Filtrar por modelo do aparelho
- `marca` - Filtrar por marca
- `grupo` - Filtrar por grupo/categoria
- `codigo` - Buscar por código exato
- `referencia` - Buscar por referência
- `codigo_barras` - Buscar por código de barras
- `localizacao` - Filtrar por localização no estoque
- `estoque_min` - Estoque mínimo
- `estoque_max` - Estoque máximo
- `preco_min` - Preço mínimo
- `preco_max` - Preço máximo
- `ativo` - true/false - filtrar por ativos/inativos
- `limit` - Quantidade de resultados (default: 50, max: 100)
- `offset` - Offset para paginação
- `ordenar` - Campo para ordenação (descricao, codigo, preco_venda, quantidade)
- `ordem` - Direção da ordenação (asc, desc)

**Exemplo:**
```bash
curl -X GET "https://api.ativafix.com/api/v1/produtos?modelo=iPhone%2015&limit=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### GET /produtos/:id
Buscar produto por ID, código ou código de barras

**Exemplo:**
```bash
curl -X GET "https://api.ativafix.com/api/v1/produtos/12345" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### GET /marcas
Listar todas as marcas

**Exemplo:**
```bash
curl -X GET "https://api.ativafix.com/api/v1/marcas" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### GET /modelos
Listar modelos (opcionalmente filtrar por marca)

**Parâmetros:**
- `marca_id` - UUID da marca para filtrar

**Exemplo:**
```bash
curl -X GET "https://api.ativafix.com/api/v1/modelos?marca_id=UUID_DA_MARCA" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### GET /grupos
Listar grupos/categorias de produtos

**Exemplo:**
```bash
curl -X GET "https://api.ativafix.com/api/v1/grupos" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### GET /docs
Ver documentação completa da API

**Exemplo:**
```bash
curl -X GET "https://api.ativafix.com/api/v1/docs" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 💻 Exemplos de Código

### JavaScript/Node.js
```javascript
const token = 'SEU_TOKEN_AQUI';

// Buscar produtos
async function buscarProdutos(modelo) {
  const response = await fetch(
    `https://api.ativafix.com/api/v1/produtos?modelo=${encodeURIComponent(modelo)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data;
}

// Usar
buscarProdutos('iPhone 15').then(produtos => {
  console.log(produtos);
});
```

### Python
```python
import requests

token = 'SEU_TOKEN_AQUI'
headers = {'Authorization': f'Bearer {token}'}

# Buscar produtos
def buscar_produtos(modelo):
    url = f'https://api.ativafix.com/api/v1/produtos'
    params = {'modelo': modelo, 'limit': 10}
    response = requests.get(url, headers=headers, params=params)
    return response.json()

# Usar
produtos = buscar_produtos('iPhone 15')
print(produtos)
```

### cURL
```bash
# Buscar produtos
curl -X GET "https://api.ativafix.com/api/v1/produtos?modelo=iPhone%2015" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Buscar produto específico
curl -X GET "https://api.ativafix.com/api/v1/produtos/12345" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Listar marcas
curl -X GET "https://api.ativafix.com/api/v1/marcas" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🤖 Para Agentes de IA

### Configuração no Agente

**Para ChatGPT/Claude/Gemini:**
```
Você tem acesso à API do PrimeCamp para consultar produtos, preços e estoque.

URL Base: https://api.ativafix.com/api/v1
Token: SEU_TOKEN_AQUI

Use esta API quando o cliente perguntar sobre:
- Preços de produtos
- Disponibilidade em estoque
- Características de produtos
- Marcas e modelos disponíveis

Exemplos de uso:
- "Qual o preço da tela do iPhone 15?" → GET /produtos?modelo=iPhone 15&busca=tela
- "Tem estoque de capa para Samsung?" → GET /produtos?marca=Samsung&busca=capa&ativo=true
- "Quais modelos de iPhone temos?" → GET /modelos?marca_id=UUID_APPLE
```

### Exemplo de Prompt para Agente

```
Você é um assistente de vendas do PrimeCamp. Use a API para responder perguntas sobre produtos.

API: https://api.ativafix.com/api/v1
Token: SEU_TOKEN_AQUI

Quando o cliente perguntar sobre produtos:
1. Identifique o modelo/marca mencionado
2. Faça uma requisição GET para /produtos com os filtros apropriados
3. Apresente os resultados de forma clara e útil

Sempre inclua o header: Authorization: Bearer SEU_TOKEN_AQUI
```

## 📝 Formato de Resposta

Todas as respostas seguem este formato:

**Sucesso:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "codigo": "12345",
      "descricao": "Tela iPhone 15",
      "preco_venda": 299.90,
      "estoque_atual": 10,
      "marca_nome": "Apple",
      "modelo_nome": "iPhone 15"
    }
  ]
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

## ⚠️ Códigos de Status HTTP

- `200` - Sucesso
- `400` - Requisição inválida
- `401` - Token inválido ou expirado
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## 🔒 Segurança

1. **Nunca compartilhe seu token** publicamente
2. **Não commite tokens** no código (use variáveis de ambiente)
3. **Revogue tokens** que não estão mais em uso
4. **Use tokens com expiração** quando possível
5. **Monitore o uso** através dos logs na interface

## 📊 Monitoramento

Você pode ver o uso do token na interface:
1. Acesse `https://app.ativafix.com/integracoes`
2. Clique no ícone de gráfico ao lado do token
3. Veja logs de acesso, requisições e erros

## 🆘 Troubleshooting

**Erro 401 - Token inválido:**
- Verifique se o token está correto
- Verifique se o token não expirou
- Verifique se está usando `Bearer ` antes do token

**Erro 404 - Não encontrado:**
- Verifique se a URL está correta
- Verifique se o endpoint existe em `/api/v1/docs`

**Erro 500 - Erro interno:**
- Entre em contato com o suporte
- Verifique os logs do token na interface

## 📞 Suporte

Para dúvidas ou problemas:
- Acesse a documentação: `GET /api/v1/docs`
- Verifique os logs do token na interface
- Entre em contato com o suporte técnico

