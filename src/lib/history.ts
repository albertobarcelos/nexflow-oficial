import { supabase } from "@/lib/supabase";

export type HistoryType = 
  | "created" 
  | "updated" 
  | "deleted"
  | "stage_changed"
  | "partner_added"
  | "partner_removed"
  | "company_linked"
  | "company_unlinked"
  | "person_linked"
  | "person_unlinked"
  | "task_added"
  | "task_completed"
  | "value_changed";

interface CreateHistoryInput {
  dealId: string;
  type: HistoryType;
  description: string;
  details?: Record<string, any>;
}

export async function createHistory({
  dealId,
  type,
  description,
  details
}: CreateHistoryInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Buscar o client_id do colaborador
  const { data: collaborator } = await supabase
    .from("collaborators")
    .select("client_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!collaborator) throw new Error("Colaborador não encontrado");

  const { error } = await supabase
    .from("deal_history")
    .insert({
      deal_id: dealId,
      user_id: user.id,
      type,
      description,
      details,
      client_id: collaborator.client_id
    });

  if (error) {
    console.error("Erro ao criar histórico:", error);
    throw error;
  }
}
