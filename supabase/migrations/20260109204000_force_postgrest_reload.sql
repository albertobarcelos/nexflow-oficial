-- =====================================================
-- MIGRATION: Forçar PostgREST a Recarregar Cache
-- =====================================================
-- Esta migration força o PostgREST a detectar mudanças
-- no schema e recarregar o cache automaticamente.
-- =====================================================

-- 1. Garantir que todas as funções RPC estão no schema public
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Verificar se há funções no schema nexflow
    FOR func_record IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'nexflow'
        AND routine_type = 'FUNCTION'
    LOOP
        RAISE WARNING 'Função % ainda existe no schema nexflow', func_record.routine_name;
    END LOOP;
END $$;

-- 2. Recriar função check_admin_access para garantir que está correta
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data record;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Sessão inválida ou expirada.');
  END IF;

  SELECT role, name, surname, is_active INTO user_data
  FROM public.core_client_users WHERE id = auth.uid();

  IF user_data IS NULL THEN
     RETURN jsonb_build_object('allowed', false, 'error', 'Perfil de usuário não encontrado.');
  END IF;

  IF user_data.role = 'administrator' AND user_data.is_active = true THEN
    UPDATE public.core_client_users SET last_login_at = now() WHERE id = auth.uid();
    RETURN jsonb_build_object(
      'allowed', true, 
      'user', jsonb_build_object('name', user_data.name, 'surname', user_data.surname)
    );
  ELSE
    RETURN jsonb_build_object('allowed', false, 'error', 'Acesso negado: Permissão insuficiente.');
  END IF;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO anon;

-- 3. Forçar PostgREST a detectar mudanças através de comentários
-- O PostgREST monitora mudanças em tabelas e funções através de comentários
DO $$
DECLARE
    timestamp_text TEXT;
BEGIN
    timestamp_text := now()::text;
    EXECUTE format('COMMENT ON TABLE public.core_client_users IS %L', 
        'Usuários do sistema. Schema migrado de nexflow para public em 2025-01-09. Cache atualizado em ' || timestamp_text);
    EXECUTE format('COMMENT ON FUNCTION public.check_admin_access() IS %L', 
        'Verifica se o usuário autenticado tem acesso ao painel administrativo. Atualizado em ' || timestamp_text);
END $$;

-- 4. Tentar notificar o PostgREST para recarregar (pode não funcionar em todos os ambientes)
-- NOTA: Esta notificação pode não funcionar em Supabase Cloud, mas não causa erro
DO $$
BEGIN
    PERFORM pg_notify('pgrst', 'reload schema');
    RAISE NOTICE 'Notificação enviada ao PostgREST para recarregar schema';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível enviar notificação ao PostgREST (normal em Supabase Cloud)';
END $$;

-- 5. Técnicas adicionais para forçar detecção de mudanças
-- Adicionar e remover uma coluna temporária (se permitido)
DO $$
BEGIN
    -- Tentar adicionar uma coluna temporária
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'core_client_users' 
        AND column_name = '_postgrest_reload_temp'
    ) THEN
        ALTER TABLE public.core_client_users 
        ADD COLUMN IF NOT EXISTS _postgrest_reload_temp BOOLEAN DEFAULT false;
        
        -- Remover imediatamente
        ALTER TABLE public.core_client_users 
        DROP COLUMN IF EXISTS _postgrest_reload_temp;
        
        RAISE NOTICE 'Coluna temporária criada e removida para forçar reload';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Não foi possível criar coluna temporária: %', SQLERRM;
END $$;

-- Criar e dropar uma view temporária
DO $$
BEGIN
    CREATE OR REPLACE VIEW public._postgrest_reload_temp_view AS
    SELECT 1 as temp;
    
    DROP VIEW IF EXISTS public._postgrest_reload_temp_view;
    
    RAISE NOTICE 'View temporária criada e removida para forçar reload';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Não foi possível criar view temporária: %', SQLERRM;
END $$;

-- =====================================================
-- NOTA FINAL
-- =====================================================
-- Estas técnicas podem ajudar, mas a forma mais garantida
-- de recarregar o cache do PostgREST é reiniciar o serviço
-- manualmente no Supabase Dashboard:
-- 1. Acesse: https://supabase.com/dashboard/project/fakjjzrucxpektnhhnjl
-- 2. Vá em Settings → API
-- 3. Procure pela opção "Reload Schema" ou "Restart PostgREST"
-- 4. Aguarde 1-2 minutos para o serviço reiniciar completamente
-- =====================================================

