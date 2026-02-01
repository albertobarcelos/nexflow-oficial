// Script para criar usuário lucas.almeida@nexsyn.com.br no Supabase Auth
// e adicionar na tabela core_client_users
// Execute: node scripts/create-lucas-user.js

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente manualmente (sem dotenv)
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    Object.assign(process.env, envVars);
  } catch (error) {
    // Se não encontrar .env, usar variáveis de ambiente do sistema
    console.log('⚠️  Arquivo .env não encontrado, usando variáveis de ambiente do sistema');
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Criar cliente Supabase com service role (tem permissões de admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser() {
  try {
    console.log('🚀 Iniciando criação do usuário...\n');

    const email = 'lucas.almeida@nexsyn.com.br';
    const password = '12345678';

    // 1. Criar usuário no auth.users usando Admin API
    console.log('1️⃣ Criando usuário no auth.users...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        first_name: 'Lucas',
        last_name: 'Almeida'
      }
    });

    let authDataResult = authData;
    
    if (authError) {
      // Se o usuário já existe, tentar buscar e atualizar senha
      if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.code === 'email_exists') {
        console.log('⚠️  Usuário já existe no auth.users, buscando ID...');
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === email);
        if (user) {
          authDataResult = { user: user };
          console.log('✅ Usuário encontrado:', user.id);
          
          // Atualizar a senha para 12345678
          console.log('🔄 Atualizando senha para 12345678...');
          const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: password }
          );
          
          if (updatePasswordError) {
            console.log('⚠️  Não foi possível atualizar a senha:', updatePasswordError.message);
          } else {
            console.log('✅ Senha atualizada com sucesso!');
          }
        } else {
          throw new Error('Usuário existe mas não foi possível encontrar');
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuário criado no auth.users:', authDataResult.user.id);
    }

    const userId = authDataResult.user.id;

    // 2. Buscar dados de referência de outros usuários
    console.log('\n2️⃣ Buscando dados de referência...');
    const { data: existingUsers, error: refError } = await supabase
      .from('core_client_users')
      .select('client_id, role, phone')
      .limit(1)
      .single();

    let clientId = 'ee065908-ecd5-4bc1-a3c9-eee45d34219f'; // Padrão
    let role = 'administrator'; // Sempre administrator conforme solicitado
    let phone = null;

    if (!refError && existingUsers) {
      clientId = existingUsers.client_id;
      phone = existingUsers.phone;
      console.log('✅ Dados de referência encontrados');
    } else {
      console.log('⚠️  Usando valores padrão');
    }
    
    // Garantir que o role seja sempre 'administrator'
    role = 'administrator';
    console.log('✅ Role definido como: administrator');

    // 3. Verificar se já existe na tabela core_client_users
    console.log('\n3️⃣ Verificando se usuário já existe em core_client_users...');
    const { data: existingClientUser } = await supabase
      .from('core_client_users')
      .select('id, role, client_id')
      .eq('email', email)
      .single();

    if (existingClientUser) {
      console.log('⚠️  Usuário já existe em core_client_users');
      
      // Usar o client_id do usuário existente
      if (existingClientUser.client_id) {
        clientId = existingClientUser.client_id;
        console.log('✅ Usando client_id do usuário existente:', clientId);
      }
      
      // Verificar se precisa atualizar o role para administrator
      if (existingClientUser.role !== 'administrator') {
        console.log('🔄 Atualizando role para administrator...');
        const { error: updateRoleError } = await supabase
          .from('core_client_users')
          .update({ role: 'administrator' })
          .eq('id', userId);
        
        if (updateRoleError) {
          console.log('⚠️  Erro ao atualizar role:', updateRoleError.message);
        } else {
          console.log('✅ Role atualizado para administrator!');
        }
      } else {
        console.log('✅ Usuário já é administrator');
      }
      
      // Continuar para verificar cliente e licença mesmo se o usuário já existe
      // (não retornar aqui, deixar continuar o fluxo)
    } else {
      // 4. Inserir na tabela core_client_users (apenas se não existir)
      console.log('\n4️⃣ Inserindo na tabela core_client_users...');
      
      // Preparar dados básicos primeiro (sem first_name e last_name)
      const userData = {
        id: userId,
        client_id: clientId,
        email: email,
        role: role,
        phone: phone,
        is_active: true
      };
      
      // Tentar adicionar campos opcionais se existirem
      // Primeiro, vamos tentar inserir apenas os campos essenciais
      const { data: newUser, error: insertError } = await supabase
        .from('core_client_users')
        .insert(userData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('✅ Usuário adicionado em core_client_users:', newUser.id);

      // 5. Tentar atualizar com first_name se a coluna existir
      console.log('\n5️⃣ Tentando adicionar nome (first_name)...');
      const { error: updateError } = await supabase
        .from('core_client_users')
        .update({ first_name: 'Lucas' })
        .eq('id', userId);
      
      if (updateError) {
        console.log('⚠️  Campo first_name não encontrado ou não pode ser atualizado:', updateError.message);
        console.log('   (Isso é normal se a coluna não existir no banco)');
      } else {
        console.log('✅ Nome adicionado: Lucas');
      }
    }

    // 6. Verificar/Criar cliente em core_clients
    console.log('\n6️⃣ Verificando se cliente existe em core_clients...');
    const { data: existingClient, error: clientCheckError } = await supabase
      .from('core_clients')
      .select('id, name, status')
      .eq('id', clientId)
      .maybeSingle();

    if (clientCheckError && clientCheckError.code !== 'PGRST116') {
      console.log('⚠️  Erro ao verificar cliente:', clientCheckError.message);
    }

    if (!existingClient) {
      console.log('⚠️  Cliente não encontrado, criando...');
      const { data: newClient, error: createClientError } = await supabase
        .from('core_clients')
        .insert({
          id: clientId,
          name: 'Nexsyn',
          company_name: 'Nexsyn Tecnologia',
          email: 'contato@nexsyn.com.br',
          cpf_cnpj: '00.000.000/0001-00', // CNPJ placeholder
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createClientError) {
        console.log('⚠️  Erro ao criar cliente:', createClientError.message);
      } else {
        console.log('✅ Cliente criado em core_clients:', newClient.id);
      }
    } else {
      console.log('✅ Cliente já existe em core_clients:', existingClient.id);
      
      // Garantir que o cliente está ativo
      if (existingClient.status !== 'active') {
        console.log('🔄 Atualizando status do cliente para active...');
        const { error: updateStatusError } = await supabase
          .from('core_clients')
          .update({ status: 'active' })
          .eq('id', clientId);
        
        if (updateStatusError) {
          console.log('⚠️  Erro ao atualizar status:', updateStatusError.message);
        } else {
          console.log('✅ Status do cliente atualizado para active!');
        }
      }
    }

    // 7. Verificar/Criar licença em core_client_license
    console.log('\n7️⃣ Verificando se licença existe em core_client_license...');
    const { data: existingLicense, error: licenseCheckError } = await supabase
      .from('core_client_license')
      .select('id, status, expiration_date')
      .eq('client_id', clientId)
      .maybeSingle();

    if (licenseCheckError && licenseCheckError.code !== 'PGRST116') {
      console.log('⚠️  Erro ao verificar licença:', licenseCheckError.message);
    }

    if (!existingLicense) {
      console.log('⚠️  Licença não encontrada, criando...');
      
      // Calcular data de expiração (1 ano a partir de hoje)
      const startDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      const { data: newLicense, error: createLicenseError } = await supabase
        .from('core_client_license')
        .insert({
          client_id: clientId,
          type: 'premium',
          start_date: startDate.toISOString(),
          expiration_date: expirationDate.toISOString(),
          status: 'active',
          user_limit: 10,
          can_use_nexhunters: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createLicenseError) {
        console.log('⚠️  Erro ao criar licença:', createLicenseError.message);
      } else {
        console.log('✅ Licença criada em core_client_license:', newLicense.id);
        console.log('   Tipo: premium');
        console.log('   Status: active');
        console.log('   Limite de usuários: 10');
        console.log('   Expira em:', expirationDate.toLocaleDateString('pt-BR'));
      }
    } else {
      console.log('✅ Licença já existe em core_client_license:', existingLicense.id);
      
      // Verificar se a licença está ativa
      if (existingLicense.status !== 'active') {
        console.log('🔄 Atualizando status da licença para active...');
        const { error: updateLicenseError } = await supabase
          .from('core_client_license')
          .update({ status: 'active' })
          .eq('id', existingLicense.id);
        
        if (updateLicenseError) {
          console.log('⚠️  Erro ao atualizar status da licença:', updateLicenseError.message);
        } else {
          console.log('✅ Status da licença atualizado para active!');
        }
      } else {
        console.log('✅ Licença já está ativa');
      }

      // Verificar se a licença expirou e renovar se necessário
      if (existingLicense.expiration_date) {
        const expirationDate = new Date(existingLicense.expiration_date);
        const today = new Date();
        if (expirationDate < today) {
          console.log('⚠️  Licença expirada em:', expirationDate.toLocaleDateString('pt-BR'));
          console.log('🔄 Renovando licença...');
          
          // Renovar por mais 1 ano
          const newExpirationDate = new Date();
          newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);
          
          const { error: renewError } = await supabase
            .from('core_client_license')
            .update({
              expiration_date: newExpirationDate.toISOString(),
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLicense.id);
          
          if (renewError) {
            console.log('⚠️  Erro ao renovar licença:', renewError.message);
          } else {
            console.log('✅ Licença renovada até:', newExpirationDate.toLocaleDateString('pt-BR'));
          }
        }
      }
    }

    // 8. Resumo
    console.log('\n' + '='.repeat(50));
    console.log('✅ CONFIGURAÇÃO COMPLETA!');
    console.log('='.repeat(50));
    console.log('Email:', email);
    console.log('Senha: 12345678');
    console.log('ID do usuário:', userId);
    console.log('Client ID:', clientId);
    console.log('Role: administrator');
    console.log('Cliente: Verificado/Criado');
    console.log('Licença: Verificada/Criada');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar
createUser();

