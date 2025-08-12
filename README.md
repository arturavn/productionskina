# 🚗 Skina Ecopeças - E-commerce de Auto Peças

Sistema completo de e-commerce especializado em auto peças, desenvolvido com React (frontend) e Node.js (backend).

## 🚀 Início Rápido

### 1. Configuração do Banco de Dados

```bash
# Execute as migrações (na raiz do projeto)
./run-migrations.sh
```

### 2. Iniciar o Sistema

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **PostgreSQL** (versão 12 ou superior)
- **npm** ou **yarn**

## 🔧 Configuração

### Banco de Dados

1. Crie um banco PostgreSQL:
   ```sql
   CREATE DATABASE skina_ecopecas;
   ```

2. Configure o arquivo `server/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=skina_ecopecas
   DB_USER=postgres
   DB_PASSWORD=sua_senha
   
   JWT_SECRET=seu_jwt_secret
   PORT=3001
   ```

3. Execute as migrações:
   ```bash
   ./run-migrations.sh
   ```

### Variáveis de Ambiente

Copie os arquivos de exemplo e configure:

```bash
# Backend
cp server/.env.example server/.env

# Frontend (se necessário)
cp .env.example .env
```

## 📁 Estrutura do Projeto

```
skina-ecopecas-storefront-main/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── hooks/             # Custom hooks
│   ├── services/          # Serviços de API
│   └── utils/             # Utilitários
├── server/                # Backend Node.js
│   ├── config/            # Configurações
│   ├── controllers/       # Controladores
│   ├── middleware/        # Middlewares
│   ├── routes/            # Rotas da API
│   ├── migrations/        # Migrações do banco
│   └── scripts/           # Scripts utilitários
├── run-migrations.sh      # Script de execução de migrações
└── MIGRAÇÕES.md          # Documentação das migrações
```

## 🗄️ Migrações do Banco de Dados

### Execução das Migrações

**Opção 1 - Script Shell (Recomendado):**
```bash
./run-migrations.sh
```

**Opção 2 - NPM Script:**
```bash
cd server
npm run migrate
```

**Opção 3 - Execução Direta:**
```bash
cd server
node scripts/run-migrations.js
```

### Dados Iniciais

Após as migrações, o sistema terá:
- 1 usuário administrador (`admin@skinaecopecas.com` / `password`)
- 6 categorias de produtos funcionais
- Estrutura completa do banco de dados

⚠️ **IMPORTANTE**: Altere a senha do administrador após o primeiro login!

## 🛠️ Scripts Disponíveis

### Frontend
```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
```

### Backend
```bash
npm run dev          # Servidor de desenvolvimento
npm run start        # Servidor de produção
npm run migrate      # Executar migrações
npm run db:setup     # Configurar banco completo
npm run db:reset     # Resetar banco de dados
```

## 🌐 URLs do Sistema

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Painel Admin**: http://localhost:5173/admin

## 📦 Funcionalidades

### Frontend (Cliente)
- 🏠 Página inicial com produtos em destaque
- 📂 Catálogo de produtos por categoria
- 🔍 Busca e filtros avançados
- 🛒 Carrinho de compras
- 👤 Área do cliente
- 📱 Design responsivo

### Backend (API)
- 🔐 Autenticação JWT
- 📦 Gestão de produtos
- 👥 Gestão de usuários
- 🛒 Gestão de pedidos
- 💳 Integração Mercado Pago
- 📧 Sistema de emails
- 🚚 Cálculo de frete

### Painel Administrativo
- 📊 Dashboard com estatísticas
- 📦 Cadastro de produtos
- 📂 Gestão de categorias
- 👥 Gestão de usuários
- 🛒 Gestão de pedidos
- 🖼️ Upload de imagens

## 🔒 Segurança

- Autenticação JWT
- Validação de dados
- Sanitização de inputs
- Headers de segurança (Helmet)
- Rate limiting
- CORS configurado

## 📱 Responsividade

- Design mobile-first
- Breakpoints otimizados
- Interface adaptável
- Performance otimizada

## 🚀 Deploy

### Frontend
```bash
npm run build
# Deploy da pasta dist/
```

### Backend
```bash
# Configure as variáveis de ambiente de produção
# Execute as migrações no servidor
# Inicie com npm start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação de migrações](MIGRAÇÕES.md)
2. Verifique os logs de erro
3. Abra uma issue no repositório

---

**Desenvolvido com ❤️ para Skina Ecopeças**# productionskina
