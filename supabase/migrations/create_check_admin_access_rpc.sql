-- Função RPC para verificar acesso ao Painel Administrativo
-- Execute este SQL no Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Executa como sistema
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

