-- =====================================================
-- SISTEMA DE ANEXOS PARA CARDS
-- =====================================================
-- Tabela para gerenciar anexos de arquivos nos cards

CREATE TABLE IF NOT EXISTS nexflow.card_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES nexflow.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.core_client_users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    client_id UUID NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_card_attachments_card_id ON nexflow.card_attachments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_attachments_user_id ON nexflow.card_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_attachments_client_id ON nexflow.card_attachments(client_id);
CREATE INDEX IF NOT EXISTS idx_card_attachments_created_at ON nexflow.card_attachments(card_id, created_at DESC);

-- Comentários
COMMENT ON TABLE nexflow.card_attachments IS 'Anexos de arquivos nos cards (até 100MB por arquivo)';
COMMENT ON COLUMN nexflow.card_attachments.file_size IS 'Tamanho do arquivo em bytes';





