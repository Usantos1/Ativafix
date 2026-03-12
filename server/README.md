# Prime Camp API Backend

API REST para conectar o frontend ao PostgreSQL.

## 🚀 Instalação

```bash
cd server
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto (não no diretório server) com:

```env
# PostgreSQL Database Configuration (OBRIGATÓRIO)
DB_HOST=your_postgres_host
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_PORT=5432
DB_SSL=false

# JWT Secret (OBRIGATÓRIO - use um valor forte e aleatório)
JWT_SECRET=your_jwt_secret_here_change_in_production

# Server Configuration
PORT=3000

# API Origin (URLs permitidas para CORS)
VITE_API_ORIGIN=http://localhost:5173,http://localhost:8080,https://app.ativafix.com

# Storage Configuration (opcional)
STORAGE_BASE_URL=http://localhost:3000/uploads

# Frontend URL (para links de reset de senha, etc)
FRONTEND_URL=http://localhost:5173

# Frontend API URL (exposta ao frontend)
VITE_API_URL=http://localhost:3000/api
```

**⚠️ IMPORTANTE:**
- NUNCA commite o arquivo `.env` no Git
- NUNCA use valores de exemplo em produção
- O backend usa variáveis `DB_*` (não `VITE_DB_*`)
- O frontend usa apenas `VITE_API_URL` (não conecta diretamente ao banco)

## 🏃 Executar

### Desenvolvimento (com auto-reload)
```bash
npm run dev
```

### Produção
```bash
npm start
```

## 📡 Endpoints

### Health Check
```
GET /health
```

### Query (SELECT)
```
POST /api/query/:table
Body: {
  select: "*" | ["campo1", "campo2"],
  where: { campo: valor, campo2__gt: valor },
  orderBy: { field: "campo", ascending: true },
  limit: 10,
  offset: 0
}
```

### Insert
```
POST /api/insert/:table
Body: { campo1: valor1, campo2: valor2 }
```

### Update
```
POST /api/update/:table
Body: {
  data: { campo: novoValor },
  where: { id: 123 }
}
```

### Delete
```
POST /api/delete/:table
Body: {
  where: { id: 123 }
}
```

### RPC (Stored Procedures)
```
POST /api/rpc/:function_name
Body: {
  params: [param1, param2]
}
```

## 🔒 Segurança

- Helmet para headers de segurança
- CORS configurado
- Rate limiting (100 req/15min por IP)
- Validação de WHERE clause obrigatória em UPDATE/DELETE

## 📝 Exemplos

### Select com WHERE
```bash
curl -X POST http://localhost:3000/api/query/ordens_servico \
  -H "Content-Type: application/json" \
  -d '{
    "select": "*",
    "where": { "status": "aberta" },
    "orderBy": { "field": "data_entrada", "ascending": false },
    "limit": 10
  }'
```

### Insert
```bash
curl -X POST http://localhost:3000/api/insert/ordens_servico \
  -H "Content-Type: application/json" \
  -d '{
    "numero": 1,
    "status": "aberta",
    "data_entrada": "2025-01-01"
  }'
```

### Update
```bash
curl -X POST http://localhost:3000/api/update/ordens_servico \
  -H "Content-Type: application/json" \
  -d '{
    "data": { "status": "fechada" },
    "where": { "id": "123" }
  }'
```

### Delete
```bash
curl -X POST http://localhost:3000/api/delete/ordens_servico \
  -H "Content-Type: application/json" \
  -d '{
    "where": { "id": "123" }
  }'
```

