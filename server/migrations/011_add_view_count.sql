-- Migração para adicionar campo de contagem de visitas aos produtos
BEGIN;

-- Adicionar campo view_count à tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Criar índice para melhor performance nas consultas de produtos mais visitados
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);

-- Atualizar produtos existentes com view_count = 0 (caso não tenham o campo)
UPDATE products SET view_count = 0 WHERE view_count IS NULL;

COMMIT;