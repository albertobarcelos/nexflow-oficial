-- AIDEV-NOTE: Função para busca flexível que remove caracteres especiais
-- Permite buscar CNPJ, telefones, etc. com ou sem pontuação

CREATE OR REPLACE FUNCTION search_companies_flexible(
  p_client_id UUID,
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  name TEXT,
  cnpj TEXT,
  razao_social TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  telefone TEXT,
  celular TEXT,
  website TEXT,
  company_type TEXT,
  logo_url TEXT,
  categoria TEXT,
  origem TEXT,
  creator_id UUID,
  setor TEXT,
  cep TEXT,
  pais TEXT,
  bairro TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  facebook TEXT,
  twitter TEXT,
  linkedin TEXT,
  instagram TEXT,
  skype TEXT,
  city_id UUID,
  state_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
DECLARE
  clean_search_term TEXT;
BEGIN
  -- Remove caracteres especiais do termo de busca para campos numéricos
  clean_search_term := regexp_replace(p_search_term, '[^0-9a-zA-Z\s]', '', 'g');
  
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      wc.*,
      COUNT(*) OVER() as total_count
    FROM web_companies wc
    WHERE wc.client_id = p_client_id
    AND (
      -- Busca em campos de texto
      wc.name ILIKE '%' || p_search_term || '%' OR
      wc.razao_social ILIKE '%' || p_search_term || '%' OR
      wc.email ILIKE '%' || p_search_term || '%' OR
      wc.website ILIKE '%' || p_search_term || '%' OR
      wc.categoria ILIKE '%' || p_search_term || '%' OR
      wc.origem ILIKE '%' || p_search_term || '%' OR
      wc.setor ILIKE '%' || p_search_term || '%' OR
      wc.pais ILIKE '%' || p_search_term || '%' OR
      wc.bairro ILIKE '%' || p_search_term || '%' OR
      wc.rua ILIKE '%' || p_search_term || '%' OR
      wc.complemento ILIKE '%' || p_search_term || '%' OR
      wc.facebook ILIKE '%' || p_search_term || '%' OR
      wc.twitter ILIKE '%' || p_search_term || '%' OR
      wc.linkedin ILIKE '%' || p_search_term || '%' OR
      wc.instagram ILIKE '%' || p_search_term || '%' OR
      wc.skype ILIKE '%' || p_search_term || '%' OR
      
      -- Busca em campos numéricos (com e sem caracteres especiais)
      wc.cnpj ILIKE '%' || p_search_term || '%' OR
      regexp_replace(wc.cnpj, '[^0-9]', '', 'g') ILIKE '%' || clean_search_term || '%' OR
      wc.whatsapp ILIKE '%' || p_search_term || '%' OR
      regexp_replace(wc.whatsapp, '[^0-9]', '', 'g') ILIKE '%' || clean_search_term || '%' OR
      wc.telefone ILIKE '%' || p_search_term || '%' OR
      regexp_replace(wc.telefone, '[^0-9]', '', 'g') ILIKE '%' || clean_search_term || '%' OR
      wc.celular ILIKE '%' || p_search_term || '%' OR
      regexp_replace(wc.celular, '[^0-9]', '', 'g') ILIKE '%' || clean_search_term || '%' OR
      wc.phone ILIKE '%' || p_search_term || '%' OR
      regexp_replace(wc.phone, '[^0-9]', '', 'g') ILIKE '%' || clean_search_term || '%' OR
      wc.cep ILIKE '%' || p_search_term || '%' OR
      regexp_replace(wc.cep, '[^0-9]', '', 'g') ILIKE '%' || clean_search_term || '%' OR
      wc.numero ILIKE '%' || p_search_term || '%' OR
      regexp_replace(wc.numero, '[^0-9]', '', 'g') ILIKE '%' || clean_search_term || '%'
    )
    ORDER BY wc.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    sr.id,
    sr.client_id,
    sr.name,
    sr.cnpj,
    sr.razao_social,
    sr.email,
    sr.phone,
    sr.whatsapp,
    sr.telefone,
    sr.celular,
    sr.website,
    sr.company_type,
    sr.logo_url,
    sr.categoria,
    sr.origem,
    sr.creator_id,
    sr.setor,
    sr.cep,
    sr.pais,
    sr.bairro,
    sr.rua,
    sr.numero,
    sr.complemento,
    sr.facebook,
    sr.twitter,
    sr.linkedin,
    sr.instagram,
    sr.skype,
    sr.city_id,
    sr.state_id,
    sr.created_at,
    sr.updated_at,
    sr.total_count
  FROM search_results sr;
END;
$$ LANGUAGE plpgsql;