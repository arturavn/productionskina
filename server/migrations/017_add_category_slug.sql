-- Migração para adicionar campo slug na tabela categories
-- Execute este arquivo para adicionar slugs SEO-friendly às categorias

BEGIN;

-- Adicionar coluna slug na tabela categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Função para gerar slug a partir do nome (se não existir)
CREATE OR REPLACE FUNCTION generate_category_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            unaccent(trim(input_text)),
                            '[áàâãäå]', 'a', 'g'
                        ),
                        '[éèêë]', 'e', 'g'
                    ),
                    '[íìîï]', 'i', 'g'
                ),
                '[óòôõö]', 'o', 'g'
            ),
            '[úùûü]', 'u', 'g'
        )
    );
    
    -- Substituir espaços e caracteres especiais por hífens
    RETURN regexp_replace(
        regexp_replace(
            lower(trim(input_text)),
            '[^a-z0-9]+', '-', 'g'
        ),
        '^-+|-+$', '', 'g'
    );
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para categorias existentes baseado no nome
UPDATE categories 
SET slug = generate_category_slug(name)
WHERE slug IS NULL;

-- Adicionar constraint de unicidade para slug
ALTER TABLE categories 
ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_categories_slug 
ON categories(slug) WHERE active = true;

-- Adicionar comentário explicativo
COMMENT ON COLUMN categories.slug IS 'Slug SEO-friendly gerado a partir do nome da categoria';

COMMIT;