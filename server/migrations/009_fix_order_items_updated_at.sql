-- Migração para adicionar coluna updated_at na tabela order_items
-- Esta migração corrige um problema onde a tabela order_items não tinha a coluna updated_at
-- que é esperada pelo sistema para manter consistência com outras tabelas

BEGIN;

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Criar trigger para atualizar updated_at automaticamente se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_order_items_updated_at'
    ) THEN
        CREATE TRIGGER update_order_items_updated_at 
        BEFORE UPDATE ON order_items 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;