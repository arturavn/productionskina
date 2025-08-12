-- Script para corrigir permissões da tabela slides
-- Execute este script como usuário postgres: sudo -u postgres psql -d skina_db -f fix-slides-permissions.sql

-- Remover tabela slides existente se houver
DROP TABLE IF EXISTS slides CASCADE;

-- Recriar a tabela slides com o usuário correto
CREATE TABLE slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    background_image VARCHAR(500) NOT NULL,
    cta_text VARCHAR(100),
    cta_link VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX idx_slides_active ON slides(is_active);
CREATE INDEX idx_slides_order ON slides(display_order);
CREATE INDEX idx_slides_active_order ON slides(is_active, display_order);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_slides_updated_at 
    BEFORE UPDATE ON slides 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir slides iniciais
INSERT INTO slides (id, title, subtitle, background_image, cta_text, cta_link, display_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Peças Automotivas de Qualidade', 'Encontre as melhores peças para seu veículo com garantia e preço justo', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Ver Produtos', '/products', 1, true),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Entrega Rápida em Todo Brasil', 'Receba suas peças com segurança e agilidade onde você estiver', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Saiba Mais', '/shipping', 2, true),
('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Suporte Especializado', 'Nossa equipe está pronta para ajudar você a encontrar a peça certa', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Fale Conosco', '/contact', 3, true);

-- Conceder permissões ao usuário skina_user
GRANT ALL PRIVILEGES ON TABLE slides TO skina_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO skina_user;

-- Confirmar que a tabela foi criada
\echo 'Tabela slides criada com sucesso e permissões concedidas!';