import { supabase } from "./supabase";

// Função helper para obter dados do usuário (incluindo usuário de teste)
export const getCurrentUserData = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Tentar buscar na tabela core_client_users
  const { data: collaborator } = await supabase
    .from("core_client_users")
    .select("id, client_id")
    .eq("id", user.id)
    .single();

  // Se encontrou, retorna os dados
  if (collaborator) {
    return collaborator;
  }

  // Se não encontrou e é o usuário de teste, retorna dados temporários
  if (user.email === "barceloshd@gmail.com") {
    return {
      client_id: "test-client-001",
      id: "test-user-001",
    };
  }

  throw new Error("Colaborador não encontrado");
};
