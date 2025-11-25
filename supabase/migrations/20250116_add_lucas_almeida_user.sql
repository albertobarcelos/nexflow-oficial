-- Migração para adicionar usuário lucas.almeida@nexsyn.com.br
-- Data: 2025-01-16
-- Descrição: Adiciona um novo usuário na tabela core_client_users baseado nos dados de usuários existentes
-- NOTA: Este script assume que o usuário será criado no Supabase Auth primeiro, ou usa um ID existente

-- Primeiro, vamos buscar dados de um usuário existente para usar como referência
DO $$
DECLARE
  v_client_id UUID;
  v_user_id UUID;
  v_role TEXT;
  v_phone TEXT;
  v_existing_user_id UUID;
BEGIN
  -- Buscar um client_id existente na tabela core_client_users
  SELECT client_id INTO v_client_id 
  FROM core_client_users 
  LIMIT 1;
  
  -- Se não encontrar, usar o client_id padrão do sistema
  IF v_client_id IS NULL THEN
    v_client_id := 'ee065908-ecd5-4bc1-a3c9-eee45d34219f'::UUID;
  END IF;
  
  -- Definir role como administrator (conforme solicitado)
  v_role := 'administrator';
  
  -- Buscar phone de um usuário existente (opcional)
  SELECT phone INTO v_phone
  FROM core_client_users
  WHERE phone IS NOT NULL
  LIMIT 1;
  
  -- Verificar se o usuário já existe no auth.users
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = 'lucas.almeida@nexsyn.com.br';
  
  -- Se o usuário existe no auth, usar o ID dele
  IF v_existing_user_id IS NOT NULL THEN
    v_user_id := v_existing_user_id;
  ELSE
    -- Se não existe, gerar um novo UUID (usuário precisará ser criado no auth depois)
    v_user_id := gen_random_uuid();
    
    -- Criar o usuário no auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'lucas.almeida@nexsyn.com.br',
      crypt('12345678', gen_salt('bf')), -- Senha: 12345678
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      ''
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- Verificar se o usuário já existe na tabela core_client_users
  IF NOT EXISTS (
    SELECT 1 FROM core_client_users WHERE email = 'lucas.almeida@nexsyn.com.br'
  ) THEN
    -- Inserir o usuário na tabela core_client_users
    INSERT INTO core_client_users (
      id,
      client_id,
      email,
      role,
      first_name,
      last_name,
      phone,
      avatar_url,
      avatar_type,
      avatar_seed,
      custom_avatar_url,
      is_active,
      last_login_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_client_id,
      'lucas.almeida@nexsyn.com.br',
      v_role,
      'Lucas',
      'Almeida',
      v_phone,
      NULL,
      'toy_face',
      '1|1',
      NULL,
      true,
      NULL,
      NOW(),
      NOW()
    );
  END IF;
END $$;

