// Script para verificar permissões do usuário lucas.almeida@nexsyn.com.br
// Execute: node scripts/check-user-permissions.js

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente manualmente
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
    console.log('⚠️  Arquivo .env não encontrado, usando variáveis de ambiente do sistema');
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkPermissions() {
  try {
    console.log('🔍 Verificando permissões do usuário lucas.almeida@nexsyn.com.br\n');

    const email = 'lucas.almeida@nexsyn.com.br';

    // 1. Verificar usuário no auth
    console.log('1️⃣ Verificando usuário no auth.users...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users?.find(u => u.email === email);
    
    if (!authUser) {
      console.log('❌ Usuário não encontrado no auth.users');
      return;
    }
    console.log('✅ Usuário encontrado no auth.users:', authUser.id);
    console.log('   Email confirmado:', authUser.email_confirmed_at ? 'Sim' : 'Não');

    // 2. Verificar usuário em core_client_users
    console.log('\n2️⃣ Verificando usuário em core_client_users...');
    const { data: clientUser, error: clientUserError } = await supabase
      .from('core_client_users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (clientUserError || !clientUser) {
      console.log('❌ Usuário não encontrado em core_client_users');
      console.log('   Erro:', clientUserError?.message);
      return;
    }
    
    console.log('✅ Usuário encontrado em core_client_users');
    console.log('   ID:', clientUser.id);
    console.log('   Email:', clientUser.email);
    console.log('   Role:', clientUser.role);
    console.log('   is_active:', clientUser.is_active);
    console.log('   client_id:', clientUser.client_id);

    // 3. Verificar cliente em core_clients
    console.log('\n3️⃣ Verificando cliente em core_clients...');
    const { data: client, error: clientError } = await supabase
      .from('core_clients')
      .select('*')
      .eq('id', clientUser.client_id)
      .single();

    if (clientError || !client) {
      console.log('❌ Cliente não encontrado em core_clients');
      console.log('   Erro:', clientError?.message);
      console.log('   client_id procurado:', clientUser.client_id);
      return;
    }

    console.log('✅ Cliente encontrado em core_clients');
    console.log('   ID:', client.id);
    console.log('   Nome:', client.name);
    console.log('   Status:', client.status);
    console.log('   ⚠️  STATUS DO CLIENTE:', client.status === 'active' ? '✅ ATIVO' : '❌ INATIVO');

    // 4. Verificar licença em core_client_license
    console.log('\n4️⃣ Verificando licença em core_client_license...');
    const { data: license, error: licenseError } = await supabase
      .from('core_client_license')
      .select('*')
      .eq('client_id', clientUser.client_id)
      .single();

    if (licenseError || !license) {
      console.log('❌ Licença não encontrada em core_client_license');
      console.log('   Erro:', licenseError?.message);
      return;
    }

    console.log('✅ Licença encontrada em core_client_license');
    console.log('   ID:', license.id);
    console.log('   Tipo:', license.type);
    console.log('   Status:', license.status);
    console.log('   Expira em:', license.expiration_date ? new Date(license.expiration_date).toLocaleDateString('pt-BR') : 'N/A');
    console.log('   ⚠️  STATUS DA LICENÇA:', license.status === 'active' ? '✅ ATIVA' : '❌ INATIVA');

    // 5. Resumo e diagnóstico
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(60));
    
    const issues = [];
    
    if (!clientUser.is_active) {
      issues.push('❌ Usuário está inativo (is_active = false)');
    }
    
    if (client.status !== 'active') {
      issues.push(`❌ Cliente está ${client.status} (deve ser 'active')`);
    }
    
    if (license.status !== 'active') {
      issues.push(`❌ Licença está ${license.status} (deve ser 'active')`);
    }
    
    if (license.expiration_date) {
      const expirationDate = new Date(license.expiration_date);
      const today = new Date();
      if (expirationDate < today) {
        issues.push(`❌ Licença expirada em ${expirationDate.toLocaleDateString('pt-BR')}`);
      }
    }

    if (issues.length === 0) {
      console.log('✅ TUDO OK! O usuário deve ter acesso ao CRM.');
      console.log('\nSe ainda assim não conseguir acessar, verifique:');
      console.log('  - Políticas RLS (Row Level Security) no Supabase');
      console.log('  - Console do navegador para erros específicos');
      console.log('  - Se está fazendo login na rota correta (/crm/login)');
    } else {
      console.log('⚠️  PROBLEMAS ENCONTRADOS:');
      issues.forEach(issue => console.log('  ' + issue));
      console.log('\n🔧 Execute o script create-lucas-user.js para corrigir automaticamente.');
    }
    
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Erro ao verificar permissões:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkPermissions();

