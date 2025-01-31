import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Person {
  id: string;
  name: string;
  email?: string;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  cargo?: string;
  cpf?: string;
  rg?: string;
  categoria?: "CLIENTE" | "FORNECEDOR" | "FUNCIONARIO" | "OUTRO";
  company_id?: string;
  responsavel_id?: string;
  description?: string;
  cep?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  client_id: string;
  created_at?: string;
  updated_at?: string;
  company_name?: string;
}

export function usePeople() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar todas as pessoas
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      const { data, error } = await supabase
        .from("people")
        .select(`
          *,
          company_people!left(
            company:companies(
              id,
              name
            )
          )
        `)
        .eq("client_id", collaborator.client_id);

      if (error) throw error;

      return data.map((person: any) => ({
        ...person,
        company_name: person.company_people?.[0]?.company?.name || null,
        company_id: person.company_people?.[0]?.company?.id || null
      }));
    },
    enabled: !!user?.id,
  });

  const { mutateAsync: createPerson } = useMutation({
    mutationFn: async (person: Omit<Person, "id" | "client_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      // Remover campos vazios ou undefined
      const cleanPerson = Object.fromEntries(
        Object.entries(person).filter(([_, value]) => value != null && value !== "")
      );

      const { data, error } = await supabase
        .from("people")
        .insert([{ ...cleanPerson, client_id: collaborator.client_id }])
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar pessoa:", error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });

  const { mutateAsync: addPerson } = useMutation({
    mutationFn: async (person: Omit<Person, "id" | "client_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: collaborator } = await supabase
        .from("collaborators")
        .select("client_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!collaborator) throw new Error("Colaborador não encontrado");

      // Remover campos vazios ou undefined
      const cleanPerson = Object.fromEntries(
        Object.entries(person).filter(([_, value]) => value != null && value !== "")
      );

      const { data, error } = await supabase
        .from("people")
        .insert([{ ...cleanPerson, client_id: collaborator.client_id }])
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar pessoa:", error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast.success("Pessoa adicionada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao adicionar pessoa:", error);
      toast.error(error.message || "Erro ao adicionar pessoa");
    },
  });

  const updatePerson = async (person: Person) => {
    // Primeiro atualizar a pessoa
    const { data: updatedPerson, error: updateError } = await supabase
      .from("people")
      .update(person)
      .eq("id", person.id)
      .select()
      .single();

    if (updateError) {
      console.error("Erro ao atualizar pessoa:", updateError);
      throw new Error(updateError.message);
    }

    // Buscar o client_id do usuário
    const { data: collaborator } = await supabase
      .from("collaborators")
      .select("client_id")
      .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!collaborator) throw new Error("Colaborador não encontrado");

    // Se houver uma empresa vinculada
    if (person.company_id) {
      // Primeiro, remover TODOS os vínculos existentes desta pessoa com empresas
      const { error: deleteError } = await supabase
        .from("company_people")
        .delete()
        .eq("person_id", person.id)
        .eq("client_id", collaborator.client_id);

      if (deleteError) {
        console.error("Erro ao remover vínculos antigos:", deleteError);
        throw new Error(deleteError.message);
      }

      // Agora criar o novo vínculo
      const { error: relationError } = await supabase
        .from("company_people")
        .insert({
          client_id: collaborator.client_id,
          company_id: person.company_id,
          person_id: person.id,
          role: person.cargo || null,
          is_primary: true // Primeira pessoa vinculada é considerada primária
        });

      if (relationError) {
        console.error("Erro ao vincular pessoa à empresa:", relationError);
        throw new Error(relationError.message);
      }
    } else {
      // Se não houver empresa vinculada, remover todos os vínculos existentes
      const { error: deleteError } = await supabase
        .from("company_people")
        .delete()
        .eq("person_id", person.id)
        .eq("client_id", collaborator.client_id);

      if (deleteError) {
        console.error("Erro ao remover vínculos:", deleteError);
        throw new Error(deleteError.message);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["people"] });
    toast.success("Pessoa atualizada com sucesso!");
    return updatedPerson;
  };

  const { mutateAsync: deletePerson } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("people")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao excluir pessoa:", error);
        throw new Error(error.message);
      }

      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast.success("Pessoa excluída com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao excluir pessoa:", error);
      toast.error(error.message || "Erro ao excluir pessoa");
    },
  });

  return {
    people,
    isLoading,
    createPerson,
    addPerson,
    updatePerson,
    deletePerson,
  };
}
