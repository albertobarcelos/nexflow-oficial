-- Adiciona coluna partner_id na tabela deals
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS partner_id UUID;

-- Adiciona chave estrangeira para a tabela partners
ALTER TABLE deals
ADD CONSTRAINT fk_deals_partner
FOREIGN KEY (partner_id) 
REFERENCES partners(id)
ON DELETE SET NULL;

-- Adiciona índice para melhorar performance de consultas
CREATE INDEX idx_deals_partner_id ON deals(partner_id);

-- Atualiza as políticas de segurança para incluir o novo campo
DROP POLICY IF EXISTS deals_select_policy ON deals;
CREATE POLICY deals_select_policy ON deals
  FOR SELECT
  USING (client_id::text = (auth.jwt() ->> 'client_id')::text);

DROP POLICY IF EXISTS deals_insert_policy ON deals;
CREATE POLICY deals_insert_policy ON deals
  FOR INSERT
  WITH CHECK (client_id::text = (auth.jwt() ->> 'client_id')::text);

DROP POLICY IF EXISTS deals_update_policy ON deals;
CREATE POLICY deals_update_policy ON deals
  FOR UPDATE
  USING (client_id::text = (auth.jwt() ->> 'client_id')::text)
  WITH CHECK (client_id::text = (auth.jwt() ->> 'client_id')::text);

DROP POLICY IF EXISTS deals_delete_policy ON deals;
CREATE POLICY deals_delete_policy ON deals
  FOR DELETE
  USING (client_id::text = (auth.jwt() ->> 'client_id')::text); 