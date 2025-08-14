-- Migração para adicionar role 'colaborador' ao sistema
-- Esta migração permite que usuários tenham o cargo de colaborador
-- com acesso restrito ao painel administrativo

BEGIN;

-- Remover o constraint atual de role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Adicionar novo constraint incluindo 'colaborador'
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin', 'colaborador'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN users.role IS 'Papel do usuário: user (cliente), admin (administrador completo), colaborador (acesso restrito ao admin)';

-- Criar índice para otimizar consultas por role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

COMMIT;