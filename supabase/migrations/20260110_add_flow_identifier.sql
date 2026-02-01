-- Adicionar campo para identificar flows em automações
ALTER TABLE public.flows
ADD COLUMN IF NOT EXISTS flow_identifier TEXT;

-- Remover constraint UNIQUE se existir (pode causar problemas com multi-tenant)
-- Vamos criar um índice único composto com client_id
DROP INDEX IF EXISTS idx_flows_flow_identifier_unique;

-- Índice composto para garantir unicidade por client_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_flows_flow_identifier_client 
ON public.flows(flow_identifier, client_id) 
WHERE flow_identifier IS NOT NULL;

-- Índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_flows_flow_identifier ON public.flows(flow_identifier);

-- Comentário explicativo
COMMENT ON COLUMN public.flows.flow_identifier IS 
'Identificador único do flow para uso em automações (ex: "parceiros", "vendas"). Deve ser único por client_id.';

