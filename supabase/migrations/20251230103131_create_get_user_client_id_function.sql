-- =====================================================
-- FUNÇÃO AUXILIAR PARA OBTER CLIENT_ID DO USUÁRIO
-- =====================================================
-- Esta função retorna o client_id do usuário autenticado
-- de forma segura, tratando casos onde o usuário não existe

CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id 
  FROM public.core_client_users 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.get_user_client_id() IS 'Retorna o client_id do usuário autenticado. Retorna NULL se o usuário não existir em core_client_users.';

