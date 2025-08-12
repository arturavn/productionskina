-- Adicionar campo 'featured' na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance nas consultas de produtos em destaque
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;

-- Comentário explicativo
COMMENT ON COLUMN products.featured IS 'Indica se o produto deve ser exibido na seção de produtos em destaque';