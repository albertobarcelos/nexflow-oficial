-- Função para buscar flow por identificador e client_id
CREATE OR REPLACE FUNCTION public.get_flow_by_identifier(
  p_flow_identifier TEXT,
  p_client_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.name, f.description
  FROM public.flows f
  WHERE f.flow_identifier = p_flow_identifier
    AND f.client_id = p_client_id
    AND (f.is_active = true OR f.is_active IS NULL)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar primeiro step de um flow
CREATE OR REPLACE FUNCTION public.get_first_step_of_flow(
  p_flow_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_step_id UUID;
BEGIN
  SELECT id INTO v_step_id
  FROM public.steps
  WHERE flow_id = p_flow_id
  ORDER BY position ASC
  LIMIT 1;
  
  RETURN v_step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION public.get_flow_by_identifier IS 
'Busca um flow ativo por seu identificador e client_id. Usado em automações para encontrar flows específicos como "parceiros" ou "vendas".';

COMMENT ON FUNCTION public.get_first_step_of_flow IS 
'Retorna o ID do primeiro step (menor position) de um flow. Usado para criar cards na primeira etapa automaticamente.';

