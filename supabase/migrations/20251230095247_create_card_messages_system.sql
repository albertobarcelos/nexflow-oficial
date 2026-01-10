-- =====================================================
-- SISTEMA DE MENSAGENS/COMENTÁRIOS PARA CARDS
-- =====================================================
-- Tabelas para gerenciar mensagens, comentários e anexos
-- de mensagens nos cards

-- Tabela de mensagens/comentários
CREATE TABLE IF NOT EXISTS nexflow.card_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.core_client_users(id) ON DELETE CASCADE,
    content TEXT, -- Texto da mensagem (nullable para mensagens apenas de arquivo)
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'audio', 'video', 'file')),
    file_url TEXT, -- URL do arquivo no storage
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT, -- MIME type
    mentions UUID[] DEFAULT '{}'::uuid[], -- Array de user_ids mencionados
    reply_to_id UUID REFERENCES nexflow.card_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_id UUID NOT NULL
);

-- Tabela de anexos de mensagens (para mensagens com múltiplos arquivos)
CREATE TABLE IF NOT EXISTS nexflow.card_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES nexflow.card_messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Adicionar foreign key de message_id em notifications (agora que a tabela existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_message_id_fkey'
        AND table_schema = 'nexflow'
    ) THEN
        ALTER TABLE nexflow.notifications
        ADD CONSTRAINT notifications_message_id_fkey
        FOREIGN KEY (message_id) REFERENCES nexflow.card_messages(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_card_messages_card_id ON nexflow.card_messages(card_id);
CREATE INDEX IF NOT EXISTS idx_card_messages_created_at ON nexflow.card_messages(card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_messages_user_id ON nexflow.card_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_card_messages_mentions ON nexflow.card_messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_card_messages_client_id ON nexflow.card_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_card_message_attachments_message_id ON nexflow.card_message_attachments(message_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION nexflow.update_card_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_card_messages_updated_at
    BEFORE UPDATE ON nexflow.card_messages
    FOR EACH ROW
    EXECUTE FUNCTION nexflow.update_card_messages_updated_at();

-- Comentários
COMMENT ON TABLE nexflow.card_messages IS 'Mensagens/comentários nos cards com suporte a texto, áudio, vídeo e arquivos';
COMMENT ON COLUMN nexflow.card_messages.message_type IS 'Tipo de mensagem: text, audio, video, file';
COMMENT ON COLUMN nexflow.card_messages.mentions IS 'Array de user_ids mencionados na mensagem';
COMMENT ON TABLE nexflow.card_message_attachments IS 'Anexos adicionais de mensagens (para múltiplos arquivos por mensagem)';




