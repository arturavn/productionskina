-- Migração para adicionar campo de código de rastreio
BEGIN;

-- Adicionar campo tracking_code à tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(255);

-- Adicionar índice para busca por código de rastreio
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);

COMMIT;