# 🚀 Execução de Migrações - Skina Ecopeças

Este documento explica como executar as migrações do banco de dados para inicializar o sistema.

## 📋 Pré-requisitos

1. **PostgreSQL** instalado e rodando
2. **Node.js** (versão 16 ou superior)
3. **Banco de dados** criado (ex: `skina_ecopecas`)
4. **Arquivo .env** configurado no diretório `server/`

## 🔧 Configuração do .env

Copie o arquivo `server/.env.example` para `server/.env` e configure:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skina_ecopecas
DB_USER=postgres
DB_PASSWORD=sua_senha
```

## 🎯 Formas de Executar as Migrações

### 1. Script Shell (Recomendado)

```bash
# Na raiz do projeto
./run-migrations.sh
```

### 2. Script NPM (No diretório server/)

```bash
cd server
npm run migrate
# ou
npm run db:migrate
```

### 3. Execução Direta

```bash
cd server
node scripts/run-migrations.js
```

## 📁 Migrações Incluídas

O sistema executará as seguintes migrações em ordem:

1. **001_create_tables.sql** - Criação das tabelas principais
2. **002_seed_data.sql** - Dados essenciais (admin + categorias)
3. **003_add_product_images.sql** - Suporte a múltiplas imagens
4. **003_create_user_addresses.sql** - Endereços de usuários
5. **004_add_featured_field.sql** - Campo de produtos em destaque
6. **005_add_password_reset_fields.sql** - Reset de senha
7. **006_add_shipping_dimensions.sql** - Dimensões para frete
8. **007_Integracao_MP.sql** - Integração Mercado Pago
9. **007_add_category_dimensions.sql** - Dimensões de categorias
10. **008_add_use_category_dimensions.sql** - Uso de dimensões
11. **008_webhook_events.sql** - Eventos de webhook
12. **009_fix_order_items_updated_at.sql** - Correção de timestamps
13. **010_add_customer_fields.sql** - Campos de cliente

## 📊 Dados Iniciais

Após a execução das migrações, o sistema terá:

- **1 usuário administrador**
  - Email: `admin@skinaecopecas.com`
  - Senha: `password` ⚠️ **ALTERE APÓS O PRIMEIRO LOGIN**

- **6 categorias funcionais**:
  - Motores
  - Suspensão
  - Freios
  - Acessórios
  - Transmissão
  - Faróis e Elétrica

## ✅ Verificação

Após executar as migrações, você verá:

```
🎉 Todas as migrações foram executadas com sucesso!

📊 Resumo do banco de dados:
   👥 Usuários: 1
   📂 Categorias: 6
   📦 Produtos: 0
   🛒 Pedidos: 0

👑 Usuário administrador configurado:
   Nome: Administrador
   Email: admin@skinaecopecas.com
   Status: active

⚠️  Senha padrão: password
🔒 IMPORTANTE: Altere a senha do administrador após o primeiro login!

✨ Sistema pronto para uso!
```

## 🚨 Solução de Problemas

### Erro de Conexão
- Verifique se o PostgreSQL está rodando
- Confirme as configurações do arquivo `.env`
- Teste a conexão manualmente

### Erro de Permissão
- Verifique se o usuário do banco tem permissões adequadas
- Confirme se o banco de dados existe

### Migração Falhou
- Execute as migrações uma por vez para identificar o problema
- Verifique os logs de erro detalhados
- Consulte a documentação do PostgreSQL

## 🔄 Próximos Passos

Após executar as migrações:

1. **Inicie o servidor backend**:
   ```bash
   cd server
   npm run dev
   ```

2. **Inicie o frontend** (em outro terminal):
   ```bash
   # Na raiz do projeto
   npm run dev
   ```

3. **Acesse o painel administrativo** para cadastrar produtos

4. **Altere a senha do administrador** no primeiro login

## 📝 Notas Importantes

- ✅ **Sem dados fictícios**: As migrações não inserem produtos ou pedidos de teste
- 🔒 **Segurança**: Sempre altere a senha padrão do administrador
- 📦 **Produtos**: Use o painel admin para cadastrar produtos reais
- 🔄 **Atualizações**: Execute novas migrações quando disponíveis

---

**Skina Ecopeças** - Sistema de E-commerce para Auto Peças