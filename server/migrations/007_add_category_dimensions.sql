-- Migração para adicionar campos de dimensões nas categorias
-- Execute este arquivo para mover as dimensões dos produtos para as categorias

-- Adicionar campos de dimensões na tabela categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8,3) DEFAULT NULL;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN categories.width_cm IS 'Largura padrão dos produtos desta categoria em centímetros para cálculo de frete';
COMMENT ON COLUMN categories.height_cm IS 'Altura padrão dos produtos desta categoria em centímetros para cálculo de frete';
COMMENT ON COLUMN categories.length_cm IS 'Comprimento padrão dos produtos desta categoria em centímetros para cálculo de frete';
COMMENT ON COLUMN categories.weight_kg IS 'Peso padrão dos produtos desta categoria em quilogramas para cálculo de frete';

-- Adicionar constraint para garantir valores positivos
ALTER TABLE categories 
ADD CONSTRAINT chk_positive_category_dimensions 
CHECK (
  (width_cm IS NULL OR width_cm > 0) AND
  (height_cm IS NULL OR height_cm > 0) AND
  (length_cm IS NULL OR length_cm > 0) AND
  (weight_kg IS NULL OR weight_kg > 0)
);

-- Definir dimensões padrão para as categorias existentes
UPDATE categories SET 
  width_cm = 15,
  height_cm = 10,
  length_cm = 20,
  weight_kg = 1.0
WHERE name = 'motores';

UPDATE categories SET 
  width_cm = 12,
  height_cm = 8,
  length_cm = 15,
  weight_kg = 0.8
WHERE name = 'suspensao';

UPDATE categories SET 
  width_cm = 10,
  height_cm = 5,
  length_cm = 12,
  weight_kg = 0.5
WHERE name = 'freios';

UPDATE categories SET 
  width_cm = 8,
  height_cm = 6,
  length_cm = 10,
  weight_kg = 0.3
WHERE name = 'acessorios';

UPDATE categories SET 
  width_cm = 20,
  height_cm = 15,
  length_cm = 25,
  weight_kg = 2.0
WHERE name = 'transmissao';

UPDATE categories SET 
  width_cm = 10,
  height_cm = 8,
  length_cm = 12,
  weight_kg = 0.4
WHERE name = 'farois-eletrica';

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_categories_dimensions 
ON categories (width_cm, height_cm, length_cm, weight_kg) 
WHERE active = true;