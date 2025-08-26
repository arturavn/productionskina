
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS mercado_livre_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scope TEXT,
    seller_id TEXT,
    nickname TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mercado_livre_accounts_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_mercado_livre_accounts_user_id 
        UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS product_images_ml (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ml_id TEXT NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_sync_state (
    ml_id TEXT PRIMARY KEY,
    last_synced_at TIMESTAMPTZ,
    last_ml_snapshot_hash TEXT,     -- hash dos campos mapeados para detectar mudanças
    last_ml_etag TEXT,              -- se a API permitir ETag/If-None-Match
    last_error TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
    CREATE TYPE sync_job_status AS ENUM ('queued', 'running', 'success', 'failed', 'partial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,                         -- 'full_import' | 'delta' | 'single_item'
    status sync_job_status NOT NULL DEFAULT 'queued',
    total INT DEFAULT 0,
    processed INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs_ml (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES sync_jobs(id) ON DELETE SET NULL,
    ml_id TEXT,
    action TEXT,                                -- 'insert' | 'update' | 'noop' | 'error'
    diff JSONB,                                 -- campos alterados
    success BOOLEAN NOT NULL DEFAULT true,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_sync_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);



DO $$
BEGIN
    -- Adicionar campo ml_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ml_id') THEN
        ALTER TABLE products ADD COLUMN ml_id TEXT;
        RAISE NOTICE 'Campo ml_id adicionado à tabela products';
    END IF;
    
    -- Adicionar campo ml_seller_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ml_seller_id') THEN
        ALTER TABLE products ADD COLUMN ml_seller_id TEXT;
        RAISE NOTICE 'Campo ml_seller_id adicionado à tabela products';
    END IF;
    
    -- Adicionar campo ml_family_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ml_family_id') THEN
        ALTER TABLE products ADD COLUMN ml_family_id TEXT;
        RAISE NOTICE 'Campo ml_family_id adicionado à tabela products';
    END IF;
    
    
END $$;

CREATE INDEX IF NOT EXISTS idx_mercado_livre_accounts_user_id ON mercado_livre_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mercado_livre_accounts_seller_id ON mercado_livre_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_mercado_livre_accounts_expires_at ON mercado_livre_accounts(expires_at);

CREATE INDEX IF NOT EXISTS idx_product_images_ml_ml_id ON product_images_ml(ml_id);
CREATE INDEX IF NOT EXISTS idx_product_images_ml_position ON product_images_ml(position);

CREATE INDEX IF NOT EXISTS idx_product_sync_state_last_synced_at ON product_sync_state(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_product_sync_state_retry_count ON product_sync_state(retry_count);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_type ON sync_jobs(type);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_sync_logs_ml_ml_id ON sync_logs_ml(ml_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_ml_job_id ON sync_logs_ml(job_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_ml_created_at ON sync_logs_ml(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_ml_action ON sync_logs_ml(action);



-- Índices para produtos com campos ML
CREATE INDEX IF NOT EXISTS idx_products_ml_id ON products(ml_id) WHERE ml_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_ml_seller_id ON products(ml_seller_id) WHERE ml_seller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_ml_family_id ON products(ml_family_id) WHERE ml_family_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;

INSERT INTO ml_sync_config (key, value, description) VALUES
    ('auto_sync_enabled', 'false', 'Habilita sincronização automática'),
    ('sync_interval_minutes', '15', 'Intervalo de sincronização em minutos'),
    ('max_concurrent_requests', '4', 'Máximo de requisições concorrentes'),
    ('batch_size', '200', 'Tamanho do lote para processamento'),
    ('retry_attempts', '3', 'Número de tentativas de retry'),
    ('rate_limit_delay_ms', '500', 'Delay entre requisições para respeitar rate limit'),

    ('sync_timeout_seconds', '300', 'Timeout para operações de sincronização')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION generate_ml_snapshot_hash(ml_data JSONB) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        digest(
            COALESCE(ml_data->>'title', '') ||
            COALESCE(ml_data->>'price', '') ||
            COALESCE(ml_data->>'available_quantity', '') ||
            COALESCE(ml_data->>'condition', '') ||
            COALESCE(ml_data->>'status', '') ||
            COALESCE(ml_data->'pictures'->0->>'url', '') ||
            COALESCE(ml_data->'attributes'::text, ''),
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ml_sync_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mercado_livre_accounts_updated_at ON mercado_livre_accounts;
CREATE TRIGGER trigger_update_mercado_livre_accounts_updated_at
    BEFORE UPDATE ON mercado_livre_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_sync_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_product_sync_state_updated_at ON product_sync_state;
CREATE TRIGGER trigger_update_product_sync_state_updated_at
    BEFORE UPDATE ON product_sync_state
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_sync_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_ml_sync_config_updated_at ON ml_sync_config;
CREATE TRIGGER trigger_update_ml_sync_config_updated_at
    BEFORE UPDATE ON ml_sync_config
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_sync_tables_updated_at();



CREATE UNIQUE INDEX IF NOT EXISTS ux_products_ml_id ON products(ml_id) WHERE ml_id IS NOT NULL;

-- Criar constraint única para ml_id (necessária para ON CONFLICT)
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'products'::regclass 
        AND conname = 'uq_products_ml_id'
    ) THEN
        -- Criar a constraint única
        ALTER TABLE products ADD CONSTRAINT uq_products_ml_id UNIQUE (ml_id);
        RAISE NOTICE 'Constraint única uq_products_ml_id criada com sucesso!';
    ELSE
        RAISE NOTICE 'Constraint única uq_products_ml_id já existe.';
    END IF;
END $$;


DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'mercado_livre_accounts',
        'product_images_ml', 
        'product_sync_state',
        'sync_jobs',
        'sync_logs_ml',
        'ml_sync_config'
    );
    
    IF table_count = 6 THEN
        RAISE NOTICE 'Todas as tabelas do Mercado Livre foram criadas com sucesso!';
    ELSE
        RAISE NOTICE 'Apenas % tabelas foram criadas. Verificar migração.', table_count;
    END IF;
END $$;

DO $$
DECLARE
    field_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO field_count
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name IN (
        'ml_id', 'ml_seller_id', 'ml_family_id', 'dimensions', 
        'weight_kg', 'width_cm', 'height_cm', 'length_cm', 
        'weight', 'brand', 'specifications'
    );
    
    IF field_count = 11 THEN
        RAISE NOTICE 'Todos os campos ML foram adicionados à tabela products!';
    ELSE
        RAISE NOTICE 'Apenas % campos ML foram encontrados. Verificar migração.', field_count;
    END IF;
END $$;

COMMIT;

SELECT 
    'Integraçao Mercado Livre completa' as titulo,
    'Agosto 2025' as data,
    'Todas as tabelas e estruturas necessárias foram criadas' as status,
    'Verificar logs acima para detalhes' as observacao;
