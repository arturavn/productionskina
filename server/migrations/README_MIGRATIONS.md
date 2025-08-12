# Migrações do Banco de Dados - Skina Ecopeças

## Resumo das Alterações Realizadas

Este documento descreve as alterações realizadas nas migrações do banco de dados para remover dados fictícios e manter apenas os dados essenciais para o funcionamento do sistema.

## Arquivo: 002_seed_data.sql

### Dados Removidos (Fictícios):

1. **Usuários Fictícios:**
   - João Silva (joao@email.com)
   - Maria Santos (maria@email.com)

2. **Produtos Fictícios:**
   - Todos os 12 produtos de exemplo foram removidos
   - Incluía produtos das categorias: Motor, Suspensão, Freios, Transmissão, Elétrica e Carroceria

3. **Pedidos Fictícios:**
   - 3 pedidos de exemplo com diferentes status (delivered, processing, pending)
   - Todos os itens de pedidos relacionados

4. **Sessões de Carrinho Fictícias:**
   - 3 sessões de carrinho de exemplo
   - Todos os itens de carrinho relacionados

5. **Histórico de Estoque Fictício:**
   - Registros de ajuste de estoque inicial para produtos fictícios

### Dados Mantidos (Essenciais):

1. **Usuário Administrador:**
   - Email: admin@skinaecopecas.com.br
   - Role: admin
   - Status: active
   - Necessário para acesso ao painel administrativo

2. **Categorias:**
   - Mantidas 6 categorias funcionais compatíveis com o frontend: motores, suspensao, freios, acessorios, transmissao, farois-eletrica
   - Essenciais para organização dos produtos

## Scripts JavaScript Removidos

Os seguintes scripts que inseriam dados de teste foram removidos:

1. **insert-categories.js** - Inseria categorias de teste
2. **create-featured-product.js** - Criava produtos em destaque fictícios
3. **test-insert.js** - Script geral de inserção de dados de teste

## Impacto das Alterações

### Positivo:
- Sistema inicia limpo, sem dados fictícios
- Dados reais podem ser inseridos através do painel administrativo
- Melhor experiência para o usuário final
- Banco de dados mais organizado e profissional

### Considerações:
- Produtos devem ser cadastrados manualmente através do painel admin
- Usuários reais devem se registrar através do sistema
- Pedidos serão criados naturalmente durante o uso

## Próximos Passos

1. Executar as migrações em um ambiente limpo
2. Fazer login com o usuário administrador
3. Cadastrar produtos reais através do painel administrativo
4. Testar o funcionamento completo do sistema

## Estrutura Final do 002_seed_data.sql

```sql
-- Dados iniciais para o e-commerce Skina Ecopeças
-- Execute este arquivo após criar as tabelas para popular com dados essenciais

-- Inserir usuário administrador padrão
INSERT INTO users (id, name, email, password, role, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Administrador', 'admin@skinaecopecas.com.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Inserir categorias essenciais
-- [6 categorias funcionais + 6 categorias básicas mantidas]

-- Produtos serão inseridos através do painel administrativo
-- Pedidos, itens de carrinho e histórico de estoque serão criados durante o uso real do sistema
```

Esta estrutura garante que o sistema tenha apenas os dados essenciais para funcionar, mantendo a integridade e profissionalismo da aplicação.