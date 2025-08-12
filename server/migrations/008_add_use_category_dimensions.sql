-- Migração para adicionar campo use_category_dimensions na tabela products
-- Execute este arquivo para adicionar o controle de uso de dimensões da categoria

-- Adicionar campo use_category_dimensions na tabela products
ALTER TABLE products 
ADD COLUMN use_category_dimensions BOOLEAN DEFAULT true;

-- Adicionar comentário explicativo
COMMENT ON COLUMN products.use_category_dimensions IS 'Define se o produto deve usar as dimensões da categoria (true) ou dimensões individuais (false)';

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_products_use_category_dimensions 
ON products(use_category_dimensions);

COMMIT;