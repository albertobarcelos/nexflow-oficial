import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

export async function getFirstFlow() {
  try {
    const collaborator = await getCurrentUserData();

    const { data: flows } = await supabase
      .from("web_funnels")
      .select("*")
      .eq("client_id", collaborator.client_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    return flows;
  } catch (error) {
    console.error("Erro ao buscar primeiro flow:", error);
    return null;
  }
}

export function useFlows() {
  return useQuery({
    queryKey: ["flows"],
    queryFn: async () => {
      try {
        const collaborator = await getCurrentUserData();

        const { data: flows } = await supabase
          .from("web_funnels")
          .select("*")
          .eq("client_id", collaborator.client_id)
          .order("created_at", { ascending: true });

        return flows || [];
      } catch (error) {
        console.error("Erro ao buscar flows:", error);
        return [];
      }
    },
  });
} 