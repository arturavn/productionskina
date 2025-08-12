-- Adicionar campo shipping_method à tabela orders
ALTER TABLE orders ADD COLUMN shipping_method JSONB;

-- Comentário explicativo
COMMENT ON COLUMN orders.shipping_method IS 'Informações do método de envio selecionado pelo cliente (transportadora, prazo, etc.)';