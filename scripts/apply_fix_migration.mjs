import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler a migration
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260109203000_fix_postgrest_schema_cache.sql');

if (!existsSync(migrationPath)) {
  console.error(`❌ Erro: Arquivo de migration não encontrado: ${migrationPath}`);
  process.exit(1);
}

console.log('📝 Aplicando migration: fix_postgrest_schema_cache.sql');
console.log('⏳ Tentando usar Supabase CLI...\n');

try {
  // Tentar usar Supabase CLI
  const migrationFile = migrationPath.split('supabase/migrations/')[1];
  execSync(`supabase db push --file supabase/migrations/${migrationFile}`, {
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  console.log('\n✅ Migration aplicada com sucesso via Supabase CLI!');
  process.exit(0);
} catch (err) {
  console.log('\n⚠️  Supabase CLI não disponível ou erro ao executar.');
  console.log('📋 Por favor, execute a migration manualmente no Supabase SQL Editor:');
  console.log(`   1. Acesse: https://supabase.com/dashboard/project/fakjjzrucxpektnhhnjl/sql/new`);
  console.log(`   2. Cole o conteúdo do arquivo: ${migrationPath}`);
  console.log(`   3. Execute a query\n`);
  process.exit(1);
}

