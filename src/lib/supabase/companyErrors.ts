/**
 * Mensagem amigável quando a criação de empresa falha por erro de configuração
 * no servidor (RLS usando ccu.user_id inexistente).
 * Orienta o administrador a aplicar a migration no Supabase.
 */
const MIGRATION_CCU_USER_ID_MESSAGE =
  "Erro de configuração no servidor. Se você é administrador, aplique a migration 20260203_fix_get_current_client_id_ccu_user_id no Supabase (SQL Editor).";

/**
 * Detecta se o erro é o 42703 (coluna inexistente) com ccu.user_id.
 * Retorna mensagem amigável nesse caso, senão a mensagem original.
 */
export function getCompanyCreateErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string } | null;
  if (err?.code === "42703" && typeof err?.message === "string" && err.message.includes("ccu.user_id")) {
    return MIGRATION_CCU_USER_ID_MESSAGE;
  }
  return err?.message && typeof err.message === "string" ? err.message : "Erro ao criar empresa";
}
