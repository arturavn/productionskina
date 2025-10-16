-- Migração 016: Adicionar campo slug para URLs amigáveis
-- Data: 2024-12-20
-- Descrição: Adiciona campo slug na tabela products para URLs SEO-friendly

-- Habilitar extensão unaccent se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Adicionar coluna slug
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Função para gerar slug a partir do nome do produto
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) 
RETURNS TEXT AS $$
DECLARE
    slug_text TEXT;
BEGIN
    -- Converter para minúsculas e remover acentos
    slug_text := lower(unaccent(input_text));
    
    -- Substituir espaços e caracteres especiais por hífens
    slug_text := regexp_replace(slug_text, '[^a-z0-9]+', '-', 'g');
    
    -- Remover hífens do início e fim
    slug_text := trim(both '-' from slug_text);
    
    -- Limitar tamanho do slug
    slug_text := left(slug_text, 200);
    
    RETURN slug_text;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para produtos existentes
UPDATE products 
SET slug = generate_slug(name) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;

-- Criar índice único para slug (importante para performance e unicidade)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN products.slug IS 'URL slug amigável para SEO, gerado automaticamente a partir do nome do produto';
COMMENT ON INDEX idx_products_slug IS 'Índice único para slugs de produtos, melhora performance de busca por URL';
COMMENT ON FUNCTION generate_slug(TEXT) IS 'Função para gerar slugs SEO-friendly a partir de texto';