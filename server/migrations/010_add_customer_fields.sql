-- Migração para adicionar campos de informações do cliente na tabela orders
-- Esta migração adiciona os campos necessários para armazenar informações do cliente
-- diretamente no pedido, independente de ter usuário cadastrado ou não

BEGIN;

-- Adicionar campos de informações do cliente
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN orders.customer_name IS 'Nome do cliente que fez o pedido';
COMMENT ON COLUMN orders.customer_last_name IS 'Sobrenome do cliente que fez o pedido';
COMMENT ON COLUMN orders.customer_email IS 'Email do cliente que fez o pedido';
COMMENT ON COLUMN orders.customer_phone IS 'Telefone do cliente que fez o pedido';

-- Criar índices para melhorar performance em consultas
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);

COMMIT;