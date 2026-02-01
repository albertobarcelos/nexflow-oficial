-- =====================================================
-- MIGRATION: Corrigir Cache do Schema PostgREST
-- =====================================================
-- Após a migração do schema nexflow para public, o PostgREST
-- pode ter o cache do schema corrompido. Esta migration força
-- o PostgREST a recarregar o cache do schema.
-- =====================================================

-- =====================================================
-- ETAPA 1: Garantir que a função check_admin_access existe
-- =====================================================

-- Recriar a função check_admin_access para garantir que está correta
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data record;
BEGIN
  -- 1. Verifica Auth
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Sessão inválida ou expirada.');
  END IF;

  -- 2. Busca Perfil
  SELECT role, name, surname, is_active
  INTO user_data
  FROM public.core_client_users
  WHERE id = auth.uid();

  -- 3. Tratamento de erro: Usuário sem perfil
  IF user_data IS NULL THEN
     RETURN jsonb_build_object('allowed', false, 'error', 'Perfil de usuário não encontrado.');
  END IF;

  -- 4. Validação de Role e Status
  IF user_data.role = 'administrator' AND user_data.is_active = true THEN
    -- Side Effect: Audit de Login
    UPDATE public.core_client_users 
    SET last_login_at = now() 
    WHERE id = auth.uid();
    
    RETURN jsonb_build_object(
      'allowed', true, 
      'user', jsonb_build_object(
        'name', user_data.name,
        'surname', user_data.surname
      )
    );
  ELSE
    RETURN jsonb_build_object('allowed', false, 'error', 'Acesso negado: Permissão insuficiente.');
  END IF;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO anon;

COMMENT ON FUNCTION public.check_admin_access() IS 'Verifica se o usuário autenticado tem acesso ao painel administrativo';

-- =====================================================
-- ETAPA 2: Forçar PostgREST a Recarregar Cache do Schema
-- =====================================================

-- O PostgREST recarrega o cache quando detecta mudanças no schema.
-- Vamos fazer uma alteração mínima em uma tabela do sistema para forçar o reload.
-- Isso é feito através de um comentário que será detectado pelo PostgREST.

COMMENT ON TABLE public.core_client_users IS 
    'Usuários do sistema. Schema migrado de nexflow para public em 2025-01-09. Cache atualizado.';

-- =====================================================
-- NOTA FINAL
-- =====================================================
-- Após executar esta migration, o PostgREST deve recarregar
-- o cache do schema automaticamente. Se o problema persistir,
-- pode ser necessário reiniciar o serviço PostgREST no Supabase.
-- =====================================================
