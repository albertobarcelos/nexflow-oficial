-- =====================================================
-- FIX: column ccu.user_id does not exist (em log_audit_history)
-- =====================================================
-- O erro ao INSERT em web_companies vem do TRIGGER de auditoria,
-- que chama log_audit_history(). Dentro dessa função há um SELECT
-- que faz LEFT JOIN core_client_users ccu ON ccu.user_id = au.id.
-- Em core_client_users a coluna correta é "id" (não user_id).
-- Este script atualiza a função para usar ccu.id = au.id.
-- =====================================================

DO $$
DECLARE
  func_oid oid;
  def text;
  new_def text;
BEGIN
  SELECT p.oid INTO func_oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'log_audit_history'
  LIMIT 1;

  IF func_oid IS NULL THEN
    RAISE NOTICE 'Função public.log_audit_history não encontrada. Nada a alterar.';
    RETURN;
  END IF;

  def := pg_get_functiondef(func_oid);
  -- Corrige o join: ccu.user_id -> ccu.id (core_client_users.id = auth user id)
  new_def := replace(def, 'ccu.user_id', 'ccu.id');

  IF new_def = def THEN
    RAISE NOTICE 'Função log_audit_history já não usa ccu.user_id (ou estrutura diferente).';
  ELSE
    EXECUTE new_def;
    RAISE NOTICE 'Função public.log_audit_history atualizada: ccu.user_id -> ccu.id';
  END IF;
END $$;
