-- Adicionar campos para reset de senha na tabela users

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);

-- Criar índice para o reset_token para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Comentários para documentação
COMMENT ON COLUMN users.reset_token IS 'Token único para reset de senha';
COMMENT ON COLUMN users.reset_token_expires IS 'Data de expiração do token de reset';
COMMENT ON COLUMN users.phone IS 'Telefone do usuário';
COMMENT ON COLUMN users.cpf IS 'CPF do usuário';