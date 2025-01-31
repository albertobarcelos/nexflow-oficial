-- Verificar e adicionar campos para gerenciamento de avatar se não existirem
DO $$
BEGIN
    -- Adicionar avatar_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'partners' AND column_name = 'avatar_type') THEN
        ALTER TABLE partners ADD COLUMN avatar_type VARCHAR(20) DEFAULT 'personas';
    END IF;

    -- Adicionar avatar_seed se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'partners' AND column_name = 'avatar_seed') THEN
        ALTER TABLE partners ADD COLUMN avatar_seed VARCHAR(100);
    END IF;

    -- Adicionar custom_avatar_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'partners' AND column_name = 'custom_avatar_url') THEN
        ALTER TABLE partners ADD COLUMN custom_avatar_url VARCHAR(255);
    END IF;
END $$;

-- Atualizar avatar_seed para parceiros existentes se estiver vazio
UPDATE partners 
SET avatar_seed = name 
WHERE avatar_seed IS NULL;

-- Adicionar comentários para documentação (os comentários são idempotentes por padrão)
COMMENT ON COLUMN partners.avatar_type IS 'Tipo de avatar: personas (default) ou custom';
COMMENT ON COLUMN partners.avatar_seed IS 'Seed para gerar o avatar do Personas';
COMMENT ON COLUMN partners.custom_avatar_url IS 'URL para avatar personalizado quando avatar_type = custom';

-- Criar índice se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'partners' AND indexname = 'idx_partners_avatar_type') THEN
        CREATE INDEX idx_partners_avatar_type ON partners(avatar_type);
    END IF;
END $$; 