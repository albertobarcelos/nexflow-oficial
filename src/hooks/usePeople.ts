import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getCurrentUserData } from "@/lib/auth";

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

      try {
        const collaborator = await getCurrentUserData();

        const { data, error } = await supabase
          .from("web_people")
          .select(`
            *,
            web_company_people!left(
              company:web_companies(
                id,
                name
              )
            )
          `)
          .eq("client_id", collaborator.client_id);

        if (error) {
          console.error("Erro ao buscar pessoas:", error);
          return [];
        }

        return data.map((person: any) => ({
          ...person,
          company_name: person.web_company_people?.[0]?.company?.name || null,
          company_id: person.web_company_people?.[0]?.company?.id || null
        }));
      } catch (error) {
        console.error("Erro ao buscar pessoas:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const { mutateAsync: createPerson } = useMutation({
    mutationFn: async (person: Omit<Person, "id" | "client_id" | "created_at" | "updated_at">) => {
      try {
        const collaborator = await getCurrentUserData();

        // Remover campos vazios ou undefined
        const cleanPerson = Object.fromEntries(
          Object.entries(person).filter(([_, value]) => value != null && value !== "")
        );

        const { data, error } = await supabase
          .from("web_people")
          .insert([{ ...cleanPerson, client_id: collaborator.client_id }])
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar pessoa:", error);
          throw new Error(error.message);
        }

        return data;
      } catch (error) {
        console.error("Erro ao adicionar pessoa:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });

  const { mutateAsync: addPerson } = useMutation({
    mutationFn: async (person: Omit<Person, "id" | "client_id" | "created_at" | "updated_at">) => {
      try {
        const collaborator = await getCurrentUserData();

        // Remover campos vazios ou undefined
        const cleanPerson = Object.fromEntries(
          Object.entries(person).filter(([_, value]) => value != null && value !== "")
        );

        const { data, error } = await supabase
          .from("web_people")
          .insert([{ ...cleanPerson, client_id: collaborator.client_id }])
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar pessoa:", error);
          throw new Error(error.message);
        }

        return data;
      } catch (error) {
        console.error("Erro ao adicionar pessoa:", error);
        throw error;
      }
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
    try {
      // Primeiro atualizar a pessoa
      const { data: updatedPerson, error: updateError } = await supabase
        .from("web_people")
        .update(person)
        .eq("id", person.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar pessoa:", updateError);
        throw new Error(updateError.message);
      }

      // Buscar o client_id do usuário
      const collaborator = await getCurrentUserData();

      // Se houver uma empresa vinculada
      if (person.company_id) {
        // Primeiro, remover TODOS os vínculos existentes desta pessoa com empresas
        const { error: deleteError } = await supabase
          .from("web_company_people")
          .delete()
          .eq("person_id", person.id)
          .eq("client_id", collaborator.client_id);

        if (deleteError) {
          console.error("Erro ao remover vínculos antigos:", deleteError);
          throw new Error(deleteError.message);
        }

        // Agora criar o novo vínculo
        const { error: relationError } = await supabase
          .from("web_company_people")
          .insert({
            client_id: collaborator.client_id,
            company_id: person.company_id,
            person_id: person.id,
            role: person.cargo || null,
            is_primary: true // Primeira pessoa vinculada é considerada primária
          });

        if (relationError) {
          console.error("Erro ao criar vínculo:", relationError);
          throw new Error(relationError.message);
        }
      }

      return updatedPerson;
    } catch (error) {
      console.error("Erro ao atualizar pessoa:", error);
      throw error;
    }
  };

  const { mutateAsync: deletePerson } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("web_people")
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
