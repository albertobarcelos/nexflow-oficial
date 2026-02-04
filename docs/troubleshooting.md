# Troubleshooting

Problemas comuns e como resolver.

## Erro ao criar empresa (ccu.user_id)

Se ao criar uma empresa (por exemplo no wizard de novo card ou no formulário rápido) aparecer erro relacionado a **`column ccu.user_id does not exist`** (código 42703), a causa é uma política RLS no banco que ainda referencia a coluna inexistente `user_id` na tabela `core_client_users` (a coluna correta é `id`).

### Solução 1: Primeira migration

1. Abra o **Supabase Dashboard** do projeto → **SQL Editor**.
2. Copie e execute o conteúdo de `supabase/migrations/20260203_fix_get_current_client_id_ccu_user_id.sql`.

### Se o erro continuar: Solução 2 (remover todas as políticas)

Às vezes restam políticas com outro nome que ainda usam a função antiga. Execute a migration que remove **todas** as políticas de `web_companies` e recria só as corretas:

1. No **SQL Editor**, copie e execute o conteúdo de `supabase/migrations/20260203_fix_web_companies_rls_drop_all_policies.sql`.

### Recarregar cache do PostgREST

Após rodar as migrations, marque no SQL Editor a opção **"Recarregar cache do PostgREST após migração de schema"** (ou execute depois, no SQL Editor: `NOTIFY pgrst, 'reload schema';`) para o Supabase passar a usar as novas definições.

### Diagnóstico (opcional)

Para conferir o que está no banco, execute no SQL Editor:

```sql
-- Definição atual da função (deve conter "ccu.id = auth.uid()", NÃO "user_id")
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_current_client_id';

-- Políticas atuais em web_companies (qual e qual expressão usam)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'web_companies';
```

A função deve usar `ccu.id = auth.uid()`. As políticas devem referenciar `public.get_current_client_id()`.

### Se o erro vier do trigger de auditoria (log_audit_history)

Se no log do Postgres o erro aparecer em **`log_audit_history(...) line X`** ou **`trigger_company_audit()`**, a causa é a função de auditoria que usa `ccu.user_id` no JOIN com `auth.users`. Corrija com:

1. No **SQL Editor**, execute o conteúdo de `supabase/migrations/20260204_fix_log_audit_history_ccu_user_id.sql`.

Esse script atualiza a função `public.log_audit_history` para usar `ccu.id = au.id` em vez de `ccu.user_id = au.id`.
