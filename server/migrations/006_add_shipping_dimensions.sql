-- Migração para adicionar campos específicos de dimensões físicas para cálculo de frete
-- Execute este arquivo para adicionar os campos necessários para integração com Melhor Envio

-- Adicionar campos específicos de dimensões físicas
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8,3) DEFAULT NULL;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN products.width_cm IS 'Largura do produto em centímetros para cálculo de frete';
COMMENT ON COLUMN products.height_cm IS 'Altura do produto em centímetros para cálculo de frete';
COMMENT ON COLUMN products.length_cm IS 'Comprimento do produto em centímetros para cálculo de frete';
COMMENT ON COLUMN products.weight_kg IS 'Peso do produto em quilogramas para cálculo de frete';

-- Atualizar produtos existentes com dimensões padrão se não tiverem
-- Isso garante que produtos sem dimensões tenham valores mínimos válidos
UPDATE products 
SET 
  width_cm = 10,
  height_cm = 10,
  length_cm = 10,
  weight_kg = 0.3
WHERE 
  (width_cm IS NULL OR width_cm = 0) AND
  (height_cm IS NULL OR height_cm = 0) AND
  (length_cm IS NULL OR length_cm = 0) AND
  (weight_kg IS NULL OR weight_kg = 0);

-- Criar índices para melhorar performance em consultas de frete
CREATE INDEX IF NOT EXISTS idx_products_shipping_dimensions 
ON products (width_cm, height_cm, length_cm, weight_kg) 
WHERE active = true;

-- Adicionar constraint para garantir valores positivos
ALTER TABLE products 
ADD CONSTRAINT chk_positive_dimensions 
CHECK (
  (width_cm IS NULL OR width_cm > 0) AND
  (height_cm IS NULL OR height_cm > 0) AND
  (length_cm IS NULL OR length_cm > 0) AND
  (weight_kg IS NULL OR weight_kg > 0)
);