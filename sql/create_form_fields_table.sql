-- Criar tabela para campos de formulário
CREATE TABLE IF NOT EXISTS web_form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES web_flows(id) ON DELETE CASCADE,
    field_type VARCHAR(50) NOT NULL,
    label TEXT NOT NULL,
    placeholder TEXT,
    description TEXT,
    help_text TEXT,
    required BOOLEAN DEFAULT false,
    editable_in_other_stages BOOLEAN DEFAULT true,
    unique_value BOOLEAN DEFAULT false,
    compact_view BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    form_type VARCHAR(20) NOT NULL CHECK (form_type IN ('initial', 'stage')),
    stage_id UUID REFERENCES web_flow_stages(id) ON DELETE CASCADE,
    validation_rules JSONB,
    field_options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_web_form_fields_flow_id ON web_form_fields(flow_id);
CREATE INDEX IF NOT EXISTS idx_web_form_fields_form_type ON web_form_fields(form_type);
CREATE INDEX IF NOT EXISTS idx_web_form_fields_stage_id ON web_form_fields(stage_id);
CREATE INDEX IF NOT EXISTS idx_web_form_fields_order ON web_form_fields(flow_id, form_type, order_index);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_web_form_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_web_form_fields_updated_at
    BEFORE UPDATE ON web_form_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_web_form_fields_updated_at();

-- RLS (Row Level Security) para garantir que usuários só vejam campos de seus próprios flows
ALTER TABLE web_form_fields ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver campos de flows do seu cliente
CREATE POLICY web_form_fields_select_policy ON web_form_fields
    FOR SELECT
    USING (
        flow_id IN (
            SELECT wf.id 
            FROM web_flows wf
            INNER JOIN core_client_users ccu ON wf.client_id = ccu.client_id
            WHERE ccu.id = auth.uid()
        )
    );

-- Política para INSERT: usuários podem inserir campos em flows do seu cliente
CREATE POLICY web_form_fields_insert_policy ON web_form_fields
    FOR INSERT
    WITH CHECK (
        flow_id IN (
            SELECT wf.id 
            FROM web_flows wf
            INNER JOIN core_client_users ccu ON wf.client_id = ccu.client_id
            WHERE ccu.id = auth.uid()
        )
    );

-- Política para UPDATE: usuários podem atualizar campos de flows do seu cliente
CREATE POLICY web_form_fields_update_policy ON web_form_fields
    FOR UPDATE
    USING (
        flow_id IN (
            SELECT wf.id 
            FROM web_flows wf
            INNER JOIN core_client_users ccu ON wf.client_id = ccu.client_id
            WHERE ccu.id = auth.uid()
        )
    )
    WITH CHECK (
        flow_id IN (
            SELECT wf.id 
            FROM web_flows wf
            INNER JOIN core_client_users ccu ON wf.client_id = ccu.client_id
            WHERE ccu.id = auth.uid()
        )
    );

-- Política para DELETE: usuários podem deletar campos de flows do seu cliente
CREATE POLICY web_form_fields_delete_policy ON web_form_fields
    FOR DELETE
    USING (
        flow_id IN (
            SELECT wf.id 
            FROM web_flows wf
            INNER JOIN core_client_users ccu ON wf.client_id = ccu.client_id
            WHERE ccu.id = auth.uid()
        )
    );

-- Comentários para documentação
COMMENT ON TABLE web_form_fields IS 'Tabela para armazenar campos de formulários dos flows';
COMMENT ON COLUMN web_form_fields.flow_id IS 'ID do flow ao qual o campo pertence';
COMMENT ON COLUMN web_form_fields.field_type IS 'Tipo do campo (text, email, phone, etc.)';
COMMENT ON COLUMN web_form_fields.form_type IS 'Tipo do formulário: initial (formulário inicial) ou stage (formulário de fase)';
COMMENT ON COLUMN web_form_fields.stage_id IS 'ID da fase (apenas para form_type = stage)';
COMMENT ON COLUMN web_form_fields.validation_rules IS 'Regras de validação em formato JSON';
COMMENT ON COLUMN web_form_fields.field_options IS 'Opções específicas do campo em formato JSON'; 