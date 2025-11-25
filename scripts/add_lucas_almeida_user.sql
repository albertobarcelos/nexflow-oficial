-- Script SQL para criar usuário lucas.almeida@nexsyn.com.br no auth.users
-- e adicionar na tabela core_client_users
-- Execute este script no SQL Editor do Supabase
-- Data: 2025-01-16
-- Senha: 12345678
-- Role: administrator

DO $$
DECLARE
  v_client_id UUID;
  v_user_id UUID;
  v_role TEXT;
  v_phone TEXT;
  v_existing_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Buscar um client_id existente
  SELECT client_id INTO v_client_id 
  FROM core_client_users 
  LIMIT 1;
  
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
  
  IF v_existing_user_id IS NOT NULL THEN
    -- Se já existe, usar o ID existente
    v_user_id := v_existing_user_id;
    RAISE NOTICE 'Usuário já existe no auth.users com ID: %', v_user_id;
  ELSE
    -- Gerar novo UUID para o usuário
    v_user_id := gen_random_uuid();
    
    -- Criptografar a senha "12345678" usando bcrypt
    v_encrypted_password := crypt('12345678', gen_salt('bf'));
    
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
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'lucas.almeida@nexsyn.com.br',
      v_encrypted_password,
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Usuário criado no auth.users com ID: %', v_user_id;
  END IF;
  
  -- Verificar se o usuário já existe na tabela core_client_users
  IF NOT EXISTS (
    SELECT 1 FROM core_client_users WHERE email = 'lucas.almeida@nexsyn.com.br'
  ) THEN
    -- Inserir na tabela core_client_users usando o ID do auth.users
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
    
    RAISE NOTICE 'Usuário adicionado na tabela core_client_users com sucesso!';
  ELSE
    RAISE NOTICE 'Usuário já existe na tabela core_client_users';
  END IF;
  
  -- 6. Verificar/Criar cliente em core_clients
  RAISE NOTICE 'Verificando se cliente existe em core_clients...';
  
  IF NOT EXISTS (SELECT 1 FROM core_clients WHERE id = v_client_id) THEN
    RAISE NOTICE 'Cliente não encontrado, criando...';
    INSERT INTO core_clients (
      id,
      name,
      company_name,
      email,
      cpf_cnpj,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_client_id,
      'Nexsyn',
      'Nexsyn Tecnologia',
      'contato@nexsyn.com.br',
      '00.000.000/0001-00',
      'active',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Cliente criado em core_clients: %', v_client_id;
  ELSE
    RAISE NOTICE 'Cliente já existe em core_clients: %', v_client_id;
    
    -- Garantir que o cliente está ativo
    UPDATE core_clients 
    SET status = 'active', updated_at = NOW()
    WHERE id = v_client_id AND status != 'active';
    
    IF FOUND THEN
      RAISE NOTICE 'Status do cliente atualizado para active';
    END IF;
  END IF;

  -- 7. Verificar/Criar licença em core_client_license
  RAISE NOTICE 'Verificando se licença existe em core_client_license...';
  
  IF NOT EXISTS (SELECT 1 FROM core_client_license WHERE client_id = v_client_id) THEN
    RAISE NOTICE 'Licença não encontrada, criando...';
    
    INSERT INTO core_client_license (
      client_id,
      type,
      start_date,
      expiration_date,
      status,
      user_limit,
      can_use_nexhunters,
      created_at,
      updated_at
    ) VALUES (
      v_client_id,
      'premium',
      NOW(),
      NOW() + INTERVAL '1 year',
      'active',
      10,
      true,
      NOW(),
      NOW()
    ) ON CONFLICT (client_id) DO NOTHING;
    
    RAISE NOTICE 'Licença criada em core_client_license para client_id: %', v_client_id;
    RAISE NOTICE 'Tipo: premium, Status: active, Limite de usuários: 10';
  ELSE
    RAISE NOTICE 'Licença já existe em core_client_license';
    
    -- Garantir que a licença está ativa
    UPDATE core_client_license 
    SET status = 'active', updated_at = NOW()
    WHERE client_id = v_client_id AND status != 'active';
    
    IF FOUND THEN
      RAISE NOTICE 'Status da licença atualizado para active';
    END IF;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Resumo:';
  RAISE NOTICE 'Email: lucas.almeida@nexsyn.com.br';
  RAISE NOTICE 'Senha: 12345678';
  RAISE NOTICE 'Role: administrator';
  RAISE NOTICE 'ID do usuário: %', v_user_id;
  RAISE NOTICE 'Client ID: %', v_client_id;
  RAISE NOTICE 'Cliente: Verificado/Criado';
  RAISE NOTICE 'Licença: Verificada/Criada';
  RAISE NOTICE '========================================';
END $$;

