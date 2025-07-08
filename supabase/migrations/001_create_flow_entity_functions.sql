-- Migration: Criar funções RPC para sistema de vinculação de entidades aos flows
-- Criado em: 2024-01-XX
-- Descrição: Implementa funções otimizadas para gerenciar vinculações entre flows e entidades

-- =====================================================================================
-- 1. FUNÇÃO: Buscar entidades disponíveis com filtros e estatísticas
-- =====================================================================================
CREATE OR REPLACE FUNCTION get_available_entities(
  p_client_id uuid,
  p_search text DEFAULT NULL,
  p_is_system boolean DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name varchar,
  slug varchar,
  icon varchar,
  color varchar,
  description text,
  is_system boolean,
  is_active boolean,
  total_flows_linked bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.slug,
    e.icon,
    e.color,
    e.description,
    e.is_system,
    e.is_active,
    COUNT(DISTINCT fel.flow_id) as total_flows_linked
  FROM web_entities e
  LEFT JOIN web_flow_entity_links fel ON e.id = fel.entity_id
  WHERE e.client_id = p_client_id
    AND e.is_active = true
    AND (p_search IS NULL OR e.name ILIKE '%' || p_search || '%')
    AND (p_is_system IS NULL OR e.is_system = p_is_system)
  GROUP BY e.id, e.name, e.slug, e.icon, e.color, e.description, e.is_system, e.is_active
  ORDER BY e.is_system DESC, e.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 2. FUNÇÃO: Buscar entidades vinculadas ao flow com dados completos
-- =====================================================================================
CREATE OR REPLACE FUNCTION get_flow_linked_entities(
  p_flow_id uuid,
  p_client_id uuid
)
RETURNS TABLE(
  link_id uuid,
  flow_id uuid,
  entity_id uuid,
  entity_name varchar,
  entity_slug varchar,
  entity_icon varchar,
  entity_color varchar,
  entity_description text,
  is_system boolean,
  is_required boolean,
  is_primary boolean,
  order_index integer,
  created_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fel.id as link_id,
    fel.flow_id,
    fel.entity_id,
    e.name as entity_name,
    e.slug as entity_slug,
    e.icon as entity_icon,
    e.color as entity_color,
    e.description as entity_description,
    e.is_system,
    fel.is_required,
    fel.is_primary,
    fel.order_index,
    fel.created_at
  FROM web_flow_entity_links fel
  JOIN web_entities e ON fel.entity_id = e.id
  WHERE fel.flow_id = p_flow_id 
    AND fel.client_id = p_client_id
    AND e.is_active = true
  ORDER BY fel.order_index ASC, fel.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 3. FUNÇÃO: Vincular entidade ao flow com validações robustas
-- =====================================================================================
CREATE OR REPLACE FUNCTION link_entity_to_flow(
  p_flow_id uuid,
  p_entity_id uuid,
  p_client_id uuid,
  p_is_required boolean DEFAULT false,
  p_is_primary boolean DEFAULT false
)
RETURNS TABLE(
  success boolean,
  message text,
  link_id uuid
) AS $$
DECLARE
  v_link_id uuid;
  v_max_order integer;
BEGIN
  -- Verificar se já existe vinculação
  IF EXISTS (
    SELECT 1 FROM web_flow_entity_links 
    WHERE flow_id = p_flow_id AND entity_id = p_entity_id AND client_id = p_client_id
  ) THEN
    RETURN QUERY SELECT false, 'Entidade já está vinculada a este flow'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Verificar se entidade existe e está ativa
  IF NOT EXISTS (
    SELECT 1 FROM web_entities 
    WHERE id = p_entity_id AND client_id = p_client_id AND is_active = true
  ) THEN
    RETURN QUERY SELECT false, 'Entidade não encontrada ou inativa'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Verificar se flow existe e pertence ao cliente
  IF NOT EXISTS (
    SELECT 1 FROM web_flows 
    WHERE id = p_flow_id AND client_id = p_client_id
  ) THEN
    RETURN QUERY SELECT false, 'Flow não encontrado ou não pertence ao cliente'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Se está marcando como principal, remover outros principais do mesmo flow
  IF p_is_primary THEN
    UPDATE web_flow_entity_links 
    SET is_primary = false 
    WHERE flow_id = p_flow_id AND client_id = p_client_id;
  END IF;

  -- Buscar próximo order_index
  SELECT COALESCE(MAX(order_index), 0) + 1 
  INTO v_max_order
  FROM web_flow_entity_links 
  WHERE flow_id = p_flow_id AND client_id = p_client_id;

  -- Inserir nova vinculação
  INSERT INTO web_flow_entity_links (
    flow_id, entity_id, client_id, is_required, is_primary, order_index
  ) VALUES (
    p_flow_id, p_entity_id, p_client_id, p_is_required, p_is_primary, v_max_order
  ) RETURNING id INTO v_link_id;

  RETURN QUERY SELECT true, 'Entidade vinculada com sucesso'::text, v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 4. FUNÇÃO: Reordenar entidades de forma otimizada
-- =====================================================================================
CREATE OR REPLACE FUNCTION reorder_flow_entities(
  p_flow_id uuid,
  p_client_id uuid,
  p_entity_orders jsonb
)
RETURNS TABLE(
  success boolean,
  message text,
  updated_count integer
) AS $$
DECLARE
  v_order_item jsonb;
  v_updated_count integer := 0;
  v_entity_id uuid;
  v_order_index integer;
BEGIN
  -- Verificar se flow existe e pertence ao cliente
  IF NOT EXISTS (
    SELECT 1 FROM web_flows 
    WHERE id = p_flow_id AND client_id = p_client_id
  ) THEN
    RETURN QUERY SELECT false, 'Flow não encontrado ou não pertence ao cliente'::text, 0;
    RETURN;
  END IF;

  -- Iterar sobre as novas ordens
  FOR v_order_item IN SELECT * FROM jsonb_array_elements(p_entity_orders)
  LOOP
    v_entity_id := (v_order_item->>'entity_id')::uuid;
    v_order_index := (v_order_item->>'order_index')::integer;
    
    -- Atualizar ordem da entidade
    UPDATE web_flow_entity_links
    SET order_index = v_order_index,
        updated_at = CURRENT_TIMESTAMP
    WHERE flow_id = p_flow_id 
      AND client_id = p_client_id
      AND entity_id = v_entity_id;
    
    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT true, 'Ordem atualizada com sucesso'::text, v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 5. FUNÇÃO: Obter estatísticas do flow
-- =====================================================================================
CREATE OR REPLACE FUNCTION get_flow_entity_stats(
  p_flow_id uuid,
  p_client_id uuid
)
RETURNS TABLE(
  total_linked integer,
  total_required integer,
  total_system integer,
  total_custom integer,
  primary_entity_id uuid,
  primary_entity_name varchar
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_linked,
    COUNT(CASE WHEN fel.is_required THEN 1 END)::integer as total_required,
    COUNT(CASE WHEN e.is_system THEN 1 END)::integer as total_system,
    COUNT(CASE WHEN NOT e.is_system THEN 1 END)::integer as total_custom,
    MAX(CASE WHEN fel.is_primary THEN e.id END) as primary_entity_id,
    MAX(CASE WHEN fel.is_primary THEN e.name END) as primary_entity_name
  FROM web_flow_entity_links fel
  JOIN web_entities e ON fel.entity_id = e.id
  WHERE fel.flow_id = p_flow_id 
    AND fel.client_id = p_client_id
    AND e.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 6. TRIGGERS E CONSTRAINTS
-- =====================================================================================

-- Trigger para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela de vinculações
DROP TRIGGER IF EXISTS update_web_flow_entity_links_updated_at ON web_flow_entity_links;
CREATE TRIGGER update_web_flow_entity_links_updated_at
  BEFORE UPDATE ON web_flow_entity_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================================================

-- Índice para garantir apenas uma entidade principal por flow
DROP INDEX IF EXISTS idx_web_flow_entity_links_unique_primary;
CREATE UNIQUE INDEX idx_web_flow_entity_links_unique_primary
ON web_flow_entity_links (flow_id, client_id)
WHERE is_primary = true;

-- Índice para garantir order_index único por flow
DROP INDEX IF EXISTS idx_web_flow_entity_links_unique_order;
CREATE UNIQUE INDEX idx_web_flow_entity_links_unique_order
ON web_flow_entity_links (flow_id, client_id, order_index);

-- Índice composto para queries de busca
DROP INDEX IF EXISTS idx_web_flow_entity_links_flow_client;
CREATE INDEX idx_web_flow_entity_links_flow_client
ON web_flow_entity_links (flow_id, client_id);

-- Índice para busca de entidades por cliente
DROP INDEX IF EXISTS idx_web_entities_client_active;
CREATE INDEX idx_web_entities_client_active
ON web_entities (client_id, is_active);

-- =====================================================================================
-- 8. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================================================

-- Habilitar RLS na tabela de vinculações
ALTER TABLE web_flow_entity_links ENABLE ROW LEVEL SECURITY;

-- Remover política existente se houver
DROP POLICY IF EXISTS "Users can manage their client's flow entity links" ON web_flow_entity_links;

-- Criar política para controle de acesso
CREATE POLICY "Users can manage their client's flow entity links"
ON web_flow_entity_links
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT client_id FROM core_client_users 
    WHERE id = auth.uid()
  )
);

-- =====================================================================================
-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================================================

COMMENT ON FUNCTION get_available_entities IS 'Busca entidades disponíveis com filtros opcionais e estatísticas de uso';
COMMENT ON FUNCTION get_flow_linked_entities IS 'Retorna todas as entidades vinculadas a um flow específico com dados completos';
COMMENT ON FUNCTION link_entity_to_flow IS 'Vincula uma entidade a um flow com validações robustas';
COMMENT ON FUNCTION reorder_flow_entities IS 'Reordena entidades vinculadas a um flow de forma otimizada';
COMMENT ON FUNCTION get_flow_entity_stats IS 'Retorna estatísticas das entidades vinculadas a um flow';

-- =====================================================================================
-- FIM DA MIGRATION
-- ===================================================================================== 