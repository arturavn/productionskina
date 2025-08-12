-- Dados iniciais para o e-commerce Skina Ecopeças
-- Execute este arquivo após criar as tabelas para popular com dados essenciais

-- Inserir usuário administrador padrão
INSERT INTO users (id, name, email, password, role, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Administrador', 'admin@skinaecopecas.com.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Inserir categorias funcionais (compatíveis com o frontend)
INSERT INTO categories (id, name, description, image_url, active) VALUES 
('660e8400-e29b-41d4-a716-446655440000', 'motores', 'Motores completos e recondicionados', '/images/categories/motores.jpg', true),
('660e8400-e29b-41d4-a716-446655440001', 'suspensao', 'Componentes do sistema de suspensão', '/images/categories/suspensao.jpg', true),
('660e8400-e29b-41d4-a716-446655440002', 'freios', 'Sistema de freios e componentes', '/images/categories/freios.jpg', true),
('660e8400-e29b-41d4-a716-446655440003', 'acessorios', 'Acessórios e peças de carroceria', '/images/categories/acessorios.jpg', true),
('660e8400-e29b-41d4-a716-446655440004', 'transmissao', 'Peças de transmissão e câmbio', '/images/categories/transmissao.jpg', true),
('660e8400-e29b-41d4-a716-446655440005', 'farois-eletrica', 'Faróis e componentes elétricos', '/images/categories/farois-eletrica.jpg', true)
ON CONFLICT (name) DO NOTHING;

-- Produtos serão inseridos através do painel administrativo
-- Não inserir produtos fictícios nas migrações

-- Pedidos, itens de carrinho e histórico de estoque serão criados durante o uso real do sistema
-- Não inserir dados fictícios nas migrações

COMMIT;

-- Atualizar sequências se necessário
-- SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
-- SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
-- SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));