-- AIDEV-NOTE: Migration para adicionar campos de avatar ToyFace na tabela core_client_users
-- Permite que usuários tenham avatares personalizados ou ToyFace

ALTER TABLE core_client_users 
ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20) DEFAULT 'toy_face',
ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(10) DEFAULT '1|1',
ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN core_client_users.avatar_type IS 'Tipo do avatar: toy_face ou custom';
COMMENT ON COLUMN core_client_users.avatar_seed IS 'Seed para ToyFace no formato numero|grupo (ex: 1|1)';
COMMENT ON COLUMN core_client_users.custom_avatar_url IS 'URL do avatar personalizado quando avatar_type = custom';

-- Atualizar usuários existentes para ter avatar padrão
UPDATE core_client_users 
SET avatar_type = 'toy_face', avatar_seed = '1|1' 
WHERE avatar_type IS NULL;