-- Bloco 1: Alterações na tabela orders
BEGIN;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS mercado_pago_payment_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS mercado_pago_preference_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS mercado_pago_payment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS mercado_pago_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS external_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS status_detail VARCHAR(100),
ADD COLUMN IF NOT EXISTS mercado_pago_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mercado_pago_payment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_details JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_mercado_pago_preference ON orders(mercado_pago_preference_id);
CREATE INDEX IF NOT EXISTS idx_orders_external_reference ON orders(external_reference);
CREATE INDEX IF NOT EXISTS idx_orders_payment_details ON orders USING GIN (payment_details);

COMMIT;

-- Bloco 2: Criação da tabela mercado_pago_preferences
BEGIN;

CREATE TABLE IF NOT EXISTS mercado_pago_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preference_id VARCHAR(100) UNIQUE NOT NULL, 
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    external_reference VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    
    payer_name VARCHAR(255),
    payer_email VARCHAR(255),
    payer_phone VARCHAR(50),
    payer_cpf VARCHAR(20),
    payer_address JSONB,
    
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    
    init_point VARCHAR(500),
    sandbox_init_point VARCHAR(500),
    payment_url VARCHAR(500),
    notification_url VARCHAR(500),
    back_urls JSONB,
    
    payment_methods JSONB,
    statement_descriptor VARCHAR(100),
    binary_mode BOOLEAN DEFAULT false,
    
    expires BOOLEAN DEFAULT false,
    expiration_date_from TIMESTAMP WITH TIME ZONE,
    expiration_date_to TIMESTAMP WITH TIME ZONE,
    
    environment VARCHAR(20) DEFAULT 'SANDBOX', 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_preferences_order_id ON mercado_pago_preferences(order_id);
CREATE INDEX IF NOT EXISTS idx_preferences_preference_id ON mercado_pago_preferences(preference_id);
CREATE INDEX IF NOT EXISTS idx_preferences_external_reference ON mercado_pago_preferences(external_reference);
CREATE INDEX IF NOT EXISTS idx_preferences_created_at ON mercado_pago_preferences(created_at);
CREATE INDEX IF NOT EXISTS idx_preferences_environment ON mercado_pago_preferences(environment);

CREATE TRIGGER update_preferences_updated_at 
BEFORE UPDATE ON mercado_pago_preferences 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
