

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- 'mercado_pago', 'payment_success', etc
    method VARCHAR(10) NOT NULL, -- 'GET', 'POST', 'PUT', 'DELETE'
    url TEXT NOT NULL, -- URL completa da requisição
    headers JSONB, -- Headers da requisição
    body JSONB, -- Body da requisição
    status VARCHAR(50) DEFAULT 'pending', -- Statys do evento
    query_params JSONB, -- Parâmetros da query string
    source_ip VARCHAR(45), -- IP de origem
    user_agent TEXT, -- User agent da requisição
    status_code INTEGER, -- Status code da resposta
    response_body JSONB, -- Corpo da resposta
    processing_time_ms INTEGER, -- Tempo de processamento em ms
    error_message TEXT, -- Mensagem de erro se houver
    order_id UUID, -- ID do pedido relacionado (se aplicável)
    external_reference VARCHAR(255), -- External reference (se aplicável)
    payment_id VARCHAR(100), -- ID do pagamento (se aplicável)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON webhook_events(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_external_reference ON webhook_events(external_reference);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhook_events_updated_at
    BEFORE UPDATE ON webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_events_updated_at();

COMMENT ON TABLE webhook_events IS 'Registra todos os eventos de webhook recebidos';
COMMENT ON COLUMN webhook_events.event_type IS 'Tipo do evento (mercado_pago, payment_success, etc)';
COMMENT ON COLUMN webhook_events.method IS 'Método HTTP da requisição';
COMMENT ON COLUMN webhook_events.url IS 'URL completa da requisição';
COMMENT ON COLUMN webhook_events.headers IS 'Headers da requisição em formato JSON';
COMMENT ON COLUMN webhook_events.body IS 'Body da requisição em formato JSON';
COMMENT ON COLUMN webhook_events.query_params IS 'Parâmetros da query string em formato JSON';
COMMENT ON COLUMN webhook_events.source_ip IS 'IP de origem da requisição';
COMMENT ON COLUMN webhook_events.user_agent IS 'User agent da requisição';
COMMENT ON COLUMN webhook_events.status_code IS 'Status code da resposta';
COMMENT ON COLUMN webhook_events.response_body IS 'Corpo da resposta em formato JSON';
COMMENT ON COLUMN webhook_events.processing_time_ms IS 'Tempo de processamento em milissegundos';
COMMENT ON COLUMN webhook_events.error_message IS 'Mensagem de erro se houver';
COMMENT ON COLUMN webhook_events.order_id IS 'ID do pedido relacionado (se aplicável)';
COMMENT ON COLUMN webhook_events.external_reference IS 'External reference do Mercado Pago';
COMMENT ON COLUMN webhook_events.payment_id IS 'ID do pagamento do Mercado Pago'; 




