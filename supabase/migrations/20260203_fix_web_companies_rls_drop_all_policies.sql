-- =====================================================
-- FIX (reforço): garantir que web_companies usa apenas
-- public.get_current_client_id() (ccu.id), sem políticas
-- antigas que referenciem auth.get_current_client_id ou user_id.
-- =====================================================
-- Se o erro "column ccu.user_id does not exist" persistir após
-- 20260203_fix_get_current_client_id_ccu_user_id.sql, pode ser
-- política com outro nome ainda referenciando função antiga.
-- Este script remove TODAS as políticas de web_companies e
-- recria apenas as corretas.
-- =====================================================

-- 1) Remover TODAS as políticas da tabela web_companies (qualquer nome)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'web_companies'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.web_companies', pol.policyname);
    RAISE NOTICE 'Política removida: %', pol.policyname;
  END LOOP;
END $$;

-- 2) Garantir função public.get_current_client_id() usando ccu.id (não user_id)
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

-- 3) Criar apenas as políticas corretas
CREATE POLICY "Users can view companies from their tenant"
  ON public.web_companies FOR SELECT
  USING (client_id = public.get_current_client_id());

CREATE POLICY "Users can insert companies to their tenant"
  ON public.web_companies FOR INSERT
  WITH CHECK (client_id = public.get_current_client_id());

CREATE POLICY "Users can update companies from their tenant"
  ON public.web_companies FOR UPDATE
  USING (client_id = public.get_current_client_id())
  WITH CHECK (client_id = public.get_current_client_id());

CREATE POLICY "Users can delete companies from their tenant"
  ON public.web_companies FOR DELETE
  USING (client_id = public.get_current_client_id());
