-- =====================================================
-- FIX: column ccu.user_id does not exist
-- =====================================================
-- O erro ocorre quando políticas RLS (ex.: INSERT em web_companies)
-- usam uma função que referencia core_client_users com coluna user_id
-- (inexistente). Em core_client_users o identificador é "id".
--
-- Solução: função em public.get_current_client_id() usando ccu.id
-- e políticas de web_companies usando public.get_current_client_id().
-- (auth.get_current_client_id não pode ser criada via MCP - permission denied for schema auth)
--
-- Em desenvolvimento: se RLS estiver desativada (ex.: migration
-- 20260109202200_disable_rls_for_development), as políticas não são
-- avaliadas e o INSERT em web_companies deve funcionar normalmente.
-- =====================================================

-- Função em schema public (id, não user_id)
CREATE OR REPLACE FUNCTION public.get_current_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ccu.client_id
  FROM public.core_client_users ccu
  WHERE ccu.id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_client_id() IS 'Retorna o client_id do usuário autenticado. Usa core_client_users.id = auth.uid().';

GRANT EXECUTE ON FUNCTION public.get_current_client_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_client_id() TO anon;

-- Políticas web_companies passam a usar public.get_current_client_id()
DROP POLICY IF EXISTS "Users can view companies from their tenant" ON web_companies;
DROP POLICY IF EXISTS "Users can insert companies to their tenant" ON web_companies;
DROP POLICY IF EXISTS "Users can update companies from their tenant" ON web_companies;
DROP POLICY IF EXISTS "Users can delete companies from their tenant" ON web_companies;

CREATE POLICY "Users can view companies from their tenant" ON web_companies FOR SELECT USING (client_id = public.get_current_client_id());
CREATE POLICY "Users can insert companies to their tenant" ON web_companies FOR INSERT WITH CHECK (client_id = public.get_current_client_id());
CREATE POLICY "Users can update companies from their tenant" ON web_companies FOR UPDATE USING (client_id = public.get_current_client_id()) WITH CHECK (client_id = public.get_current_client_id());
CREATE POLICY "Users can delete companies from their tenant" ON web_companies FOR DELETE USING (client_id = public.get_current_client_id());
