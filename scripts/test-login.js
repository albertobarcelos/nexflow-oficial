// Script para testar login do usuário lucas.almeida@nexsyn.com.br
// Execute: node scripts/test-login.js

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    console.log('⚠️  Arquivo .env não encontrado');
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

// Usar chave anon (não service role) para simular login real
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

async function testLogin() {
  try {
    console.log('🔐 Testando login do usuário lucas.almeida@nexsyn.com.br\n');

    const email = 'lucas.almeida@nexsyn.com.br';
    const password = '12345678';

    // 1. Tentar fazer login
    console.log('1️⃣ Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.log('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('   User ID:', authData.user.id);

    // 2. Tentar buscar dados do usuário em core_client_users
    console.log('\n2️⃣ Buscando dados em core_client_users...');
    const { data: collaboratorData, error: collaboratorError } = await supabase
      .from('core_client_users')
      .select(`
        id,
        client_id,
        email,
        role,
        is_active
      `)
      .eq('id', authData.user.id)
      .single();

    if (collaboratorError) {
      console.log('❌ Erro ao buscar dados:', collaboratorError.message);
      console.log('   Código:', collaboratorError.code);
      console.log('   Detalhes:', collaboratorError.details);
      console.log('   Hint:', collaboratorError.hint);
      
      if (collaboratorError.code === 'PGRST301' || collaboratorError.message.includes('permission denied')) {
        console.log('\n⚠️  PROBLEMA: Política RLS pode estar bloqueando o acesso!');
        console.log('   A política RLS pode não estar permitindo que o usuário veja seus próprios dados.');
        console.log('   Verifique se a política está configurada corretamente no Supabase.');
      }
      return;
    }

    if (!collaboratorData) {
      console.log('❌ Usuário não encontrado em core_client_users');
      return;
    }

    console.log('✅ Dados encontrados em core_client_users:');
    console.log('   ID:', collaboratorData.id);
    console.log('   Email:', collaboratorData.email);
    console.log('   Role:', collaboratorData.role);
    console.log('   is_active:', collaboratorData.is_active);
    console.log('   client_id:', collaboratorData.client_id);

    // 3. Verificar se o usuário está ativo
    if (!collaboratorData.is_active) {
      console.log('\n❌ PROBLEMA: Usuário está inativo (is_active = false)');
      return;
    }

    console.log('\n✅ TUDO OK! O usuário deve conseguir acessar o CRM.');
    console.log('\nSe ainda assim não conseguir, verifique:');
    console.log('  - Console do navegador para erros específicos');
    console.log('  - Se está acessando a rota correta (/crm/login)');
    console.log('  - Políticas RLS no Supabase Dashboard');

    // Fazer logout
    await supabase.auth.signOut();

  } catch (error) {
    console.error('\n❌ Erro ao testar login:', error.message);
    console.error(error);
  }
}

testLogin();

