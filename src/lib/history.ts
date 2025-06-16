import { supabase } from "./supabase";

interface CreateHistoryInput {
  dealId: string;
  type: string;
  description: string;
  details?: any;
}

// Função helper para obter dados do usuário (incluindo usuário de teste)
const getCurrentUserData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Tentar buscar na tabela core_client_users
  const { data: collaborator } = await supabase
    .from("core_client_users")
    .select("client_id")
    .eq("id", user.id)
    .single();

  // Se encontrou, retorna os dados
  if (collaborator) {
    return collaborator;
  }

  // Se não encontrou e é o usuário de teste, retorna dados temporários
  if (user.email === 'barceloshd@gmail.com') {
    return {
      client_id: 'ee065908-ecd5-4bc1-a3c9-eee45d34219f'
    };
  }

  throw new Error("Colaborador não encontrado");
};

export async function createHistory({
  dealId,
  type,
  description,
  details
}: CreateHistoryInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const collaborator = await getCurrentUserData();

    const { error } = await supabase
      .from('web_deal_history')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        type,
        description,
        details,
        client_id: collaborator.client_id
      });

    if (error) {
      console.error('Erro ao criar histórico:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar histórico:', error);
    // Não quebrar o fluxo principal se o histórico falhar
  }
}