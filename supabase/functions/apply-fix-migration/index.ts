import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIGRATION_SQL = `
-- =====================================================
-- MIGRATION: Corrigir Cache do Schema PostgREST
-- =====================================================

-- ETAPA 1: Verificar e Limpar Referências ao Schema Nexflow
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    type_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'nexflow';
    SELECT COUNT(*) INTO function_count FROM information_schema.routines WHERE routine_schema = 'nexflow';
    SELECT COUNT(*) INTO type_count FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'nexflow';
    
    IF table_count > 0 OR function_count > 0 OR type_count > 0 THEN
        RAISE WARNING 'Ainda existem objetos no schema nexflow: % tabelas, % funções, % tipos', table_count, function_count, type_count;
    ELSE
        RAISE NOTICE 'Schema nexflow está vazio - OK';
    END IF;
END $$;

-- ETAPA 2: Garantir que a função auth.get_current_client_id existe
CREATE OR REPLACE FUNCTION auth.get_current_client_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT client_id FROM public.core_client_users WHERE id = auth.uid() LIMIT 1);
END;
$$;

GRANT EXECUTE ON FUNCTION auth.get_current_client_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_current_client_id() TO anon;

COMMENT ON FUNCTION auth.get_current_client_id() IS 'Retorna o client_id do usuário autenticado. Usado em políticas RLS.';

-- ETAPA 3: Forçar PostgREST a Recarregar Cache do Schema
COMMENT ON TABLE public.core_client_users IS 'Usuários do sistema. Schema migrado de nexflow para public em 2025-01-09. Cache atualizado em ' || now()::text;

-- ETAPA 4: Garantir que a função check_admin_access existe
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
    RETURN jsonb_build_object('allowed', true, 'user', jsonb_build_object('name', user_data.name, 'surname', user_data.surname));
  ELSE
    RETURN jsonb_build_object('allowed', false, 'error', 'Acesso negado: Permissão insuficiente.');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_access() TO anon;

COMMENT ON FUNCTION public.check_admin_access() IS 'Verifica se o usuário autenticado tem acesso ao painel administrativo';
`;

serve(async (req) => {
  try {
    // Verificar autenticação (apenas service role pode executar)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Executar a migration usando a função exec_sql ou diretamente
    // Nota: Supabase não permite execução direta de SQL via cliente
    // Esta função serve apenas como exemplo - a migration deve ser aplicada manualmente

    return new Response(
      JSON.stringify({
        message: "Migration deve ser aplicada manualmente no SQL Editor",
        instructions: [
          "1. Acesse o Supabase Dashboard",
          "2. Vá para SQL Editor",
          "3. Cole o conteúdo da migration: supabase/migrations/20260109203000_fix_postgrest_schema_cache.sql",
          "4. Execute a query"
        ]
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});


