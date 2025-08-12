# Documentação do Projeto Skina Ecopeças

desenvolvido com React/TypeScript no frontend e Node.js/Express no backend, utilizando PostgreSQL como banco de dados.

## Estrutura do Projeto

```
skina-ecopecas-storefront-main/
├── server/                 # Backend (Node.js + Express)
│   ├── config/            # Configurações do banco e aplicação
│   ├── models/            # Modelos de dados (User, Product, etc.)
│   ├── routes/            # Rotas da API
│   ├── services/          # Serviços (email, etc.)
│   ├── migrations/        # Migrações do banco de dados
│   ├── .env              # Variáveis de ambiente do backend
│   └── server.js         # Arquivo principal do servidor
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # Componentes React reutilizáveis
│   ├── pages/            # Páginas da aplicação
│   ├── contexts/         # Contextos React (Auth, Cart, etc.)
│   ├── hooks/            # Hooks customizados
│   ├── services/         # Serviços de API
│   └── lib/              # Utilitários e configurações
├── .env                  # Variáveis de ambiente do frontend
└── public/               # Arquivos estáticos
```

## Pré-requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

## Configuração do Ambiente

### 1. Banco de Dados PostgreSQL

1. Instale o PostgreSQL
2. Crie um banco de dados chamado `skina_ecopecas`
3. Configure as credenciais no arquivo `.env` do servidor

### 2. Configuração do Backend

#### Arquivo `server/.env`
```env
# Configuração do Servidor
PORT=3001

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skina_ecopecas
DB_USER=seu_usuario
DB_PASSWORD=s

# URLs
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:3001

# Segurança
JWT_SECRET=sua_chave_jwt_secreta
SESSION_SECRET=sua_chave_sessao_secreta

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
EMAIL_FROM=Nome <seu_email@gmail.com>

# Melhor Envio (Frete)
MELHOR_ENVIO_TOKEN=seu_token_melhor_envio
MELHOR_ENVIO_SANDBOX=true

# Ambiente
NODE_ENV=development
```

### 3. Configuração do Frontend

#### Arquivo `.env`
```env
VITE_API_URL=http://localhost:3001/api
```

## Instalação e Execução

### 1. Instalar Dependências

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 2. Configurar Banco de Dados

```bash
# No diretório server/
# Execute as migrações (se houver)
node migrations/run-migrations.js
```

### 3. Executar o Projeto

#### Opção 1: Executar separadamente

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

#### Opção 2: Script de desenvolvimento (se disponível)

```bash
# Na raiz do projeto
npm run dev:all
```

### 4. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## Principais Funcionalidades

### Autenticação
- Registro de usuários
- Login/Logout
- Recuperação de senha
- JWT para autenticação

### E-commerce
- Catálogo de produtos
- Carrinho de compras
- Checkout
- Cálculo de frete (Melhor Envio)
- Gestão de pedidos

### Administração
- Gestão de produtos
- Gestão de categorias
- Gestão de usuários
- Relatórios

## Arquivos Importantes

### Backend

| Arquivo | Descrição |
|---------|----------|
| `server/server.js` | Arquivo principal do servidor |
| `server/routes/auth.js` | Rotas de autenticação |
| `server/routes/products.js` | Rotas de produtos |
| `server/routes/cart.js` | Rotas do carrinho |
| `server/models/User.js` | Modelo de usuário |
| `server/models/Product.js` | Modelo de produto |
| `server/config/database.js` | Configuração do banco |
| `server/services/emailService.js` | Serviço de email |

### Frontend

| Arquivo | Descrição |
|---------|----------|
| `src/App.tsx` | Componente principal |
| `src/contexts/AuthContext.tsx` | Contexto de autenticação |
| `src/contexts/CartContext.tsx` | Contexto do carrinho |
| `src/services/api.ts` | Configuração da API |
| `src/hooks/useApi.ts` | Hook para chamadas de API |
| `src/pages/Login.tsx` | Página de login |
| `src/pages/Products.tsx` | Página de produtos |
| `src/components/Header.tsx` | Cabeçalho da aplicação |

## Banco de Dados

### Principais Tabelas

- **users**: Usuários do sistema
- **products**: Produtos do catálogo
- **categories**: Categorias de produtos
- **cart_sessions**: Sessões de carrinho
- **cart_items**: Itens do carrinho
- **orders**: Pedidos
- **order_items**: Itens dos pedidos

## APIs Principais

### Autenticação
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password` - Redefinir senha

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter produto
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/:id` - Atualizar produto (admin)
- `DELETE /api/products/:id` - Deletar produto (admin)

### Carrinho
- `GET /api/cart/:sessionId` - Obter carrinho
- `POST /api/cart/:sessionId/items` - Adicionar item
- `PUT /api/cart/:sessionId/items/:itemId` - Atualizar item
- `DELETE /api/cart/:sessionId/items/:itemId` - Remover item

## Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Lucide React (ícones)

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT (jsonwebtoken)
- bcrypt
- express-validator
- nodemailer
- multer (upload de arquivos)
- cors

## Problemas Conhecidos e Soluções

### 1. Erro de Conexão com API
**Problema**: ERR_CONNECTION_REFUSED
**Solução**: Verificar se os IPs no `.env` do frontend e backend estão alinhados

### 2. Problema com Email e Pontos
**Problema**: Emails com pontos não fazem login
**Solução**: Removido `.normalizeEmail()` das validações em `auth.js`

### 3. CORS
**Problema**: Erro de CORS
**Solução**: Configurar `FRONTEND_URL` no `.env` do backend

## Backup e Restauração

### Criar Backup
```bash
pg_dump -h localhost -U seu_usuario -d skina_ecopecas > backup.sql
```

### Restaurar Backup
```bash
psql -h localhost -U seu_usuario -d skina_ecopecas < backup.sql
```

## Deployment

### Variáveis de Ambiente para Produção

1. Alterar `NODE_ENV=production`
2. Configurar URLs de produção
3. Usar credenciais seguras para JWT_SECRET
4. Configurar SSL para PostgreSQL
5. Configurar HTTPS

### Build do Frontend
```bash
npm run build
```


---

**Última atualização**: Julho 2025
**Versão**: 1.0.0