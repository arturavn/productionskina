-- Migração para criar tabela de slides do carousel
-- Esta migração adiciona persistência para os slides que atualmente estão apenas em memória

-- Criar tabela de slides
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url VARCHAR(500) NOT NULL,
    button_text VARCHAR(100),
    button_link VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_slides_active ON slides(active);
CREATE INDEX IF NOT EXISTS idx_slides_order ON slides(display_order);
CREATE INDEX IF NOT EXISTS idx_slides_active_order ON slides(active, display_order);

-- Trigger para atualizar updated_at automaticamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_slides_updated_at'
    ) THEN
        CREATE TRIGGER update_slides_updated_at 
            BEFORE UPDATE ON slides 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Inserir slides iniciais (dados que estavam em memória)
INSERT INTO slides (id, title, subtitle, image_url, button_text, button_link, display_order, active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Peças Automotivas de Qualidade', 'Encontre as melhores peças para seu veículo com garantia e preço justo', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Ver Produtos', '/products', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'Entrega Rápida em Todo Brasil', 'Receba suas peças com segurança e agilidade onde você estiver', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Saiba Mais', '/shipping', 2, true),
('550e8400-e29b-41d4-a716-446655440003', 'Suporte Especializado', 'Nossa equipe está pronta para ajudar você a encontrar a peça certa', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', 'Fale Conosco', '/contact', 3, true)
ON CONFLICT (id) DO NOTHING;