import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  isCurrentUser?: boolean;
}

export function useUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Pegar usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuário não autenticado");

      // Buscar client_id do usuário atual
      const { data: currentCollaborator, error: collaboratorError } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", currentUser.id)
        .single();

      if (collaboratorError || !currentCollaborator) {
        console.error("Erro ao buscar colaborador:", collaboratorError);
        throw new Error("Colaborador não encontrado");
      }

      // Buscar todos os usuários do mesmo client_id
      const { data: collaborators, error } = await supabase
        .from("collaborators")
        .select(`
          auth_user_id,
          name,
          email
        `)
        .eq("client_id", currentCollaborator.client_id);

      if (error) {
        console.error("Erro ao buscar colaboradores:", error);
        throw error;
      }

      return (collaborators || [])
        .map(collaborator => {
          const isCurrentUser = collaborator.auth_user_id === currentUser.id;
          return {
            id: collaborator.auth_user_id,
            email: collaborator.email || "",
            name: isCurrentUser 
              ? `Eu (${collaborator.name || collaborator.email})` 
              : (collaborator.name || collaborator.email || ""),
            isCurrentUser
          };
        })
        .sort((a, b) => {
          // Usuário atual sempre primeiro
          if (a.isCurrentUser) return -1;
          if (b.isCurrentUser) return 1;
          return a.name.localeCompare(b.name);
        });
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Encontrar o usuário atual
  const currentUser = users.find(user => user.isCurrentUser);

  return {
    users,
    currentUser,
    isLoading,
  };
} 