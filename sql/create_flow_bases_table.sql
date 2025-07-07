-- Tabela para vincular bases de dados aos flows
CREATE TABLE IF NOT EXISTS web_flow_bases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID NOT NULL REFERENCES web_flows(id) ON DELETE CASCADE,
    base_id UUID NOT NULL REFERENCES web_databases(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES core_clients(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Garantir que não há duplicatas
    UNIQUE(flow_id, base_id, client_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_web_flow_bases_flow_id ON web_flow_bases(flow_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_bases_base_id ON web_flow_bases(base_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_bases_client_id ON web_flow_bases(client_id);
CREATE INDEX IF NOT EXISTS idx_web_flow_bases_order ON web_flow_bases(flow_id, order_index);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_web_flow_bases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_web_flow_bases_updated_at
    BEFORE UPDATE ON web_flow_bases
    FOR EACH ROW
    EXECUTE FUNCTION update_web_flow_bases_updated_at();

-- Row Level Security (RLS)
ALTER TABLE web_flow_bases ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas aos dados do cliente
CREATE POLICY "Users can view flow bases from their client" ON web_flow_bases
    FOR SELECT USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert flow bases for their client" ON web_flow_bases
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update flow bases from their client" ON web_flow_bases
    FOR UPDATE USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete flow bases from their client" ON web_flow_bases
    FOR DELETE USING (
        client_id IN (
            SELECT client_id 
            FROM core_client_users 
            WHERE id = auth.uid()
        )
    );

-- Comentários para documentação
COMMENT ON TABLE web_flow_bases IS 'Tabela para vincular bases de dados aos flows';
COMMENT ON COLUMN web_flow_bases.flow_id IS 'ID do flow ao qual a base está vinculada';
COMMENT ON COLUMN web_flow_bases.base_id IS 'ID da base de dados vinculada';
COMMENT ON COLUMN web_flow_bases.client_id IS 'ID do cliente proprietário';
COMMENT ON COLUMN web_flow_bases.is_required IS 'Se a base é obrigatória no formulário';
COMMENT ON COLUMN web_flow_bases.order_index IS 'Ordem de exibição da base no formulário'; 