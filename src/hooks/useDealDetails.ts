import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";
import { Deal } from "@/types/deals";
import { toast } from "sonner";

export function useDealDetails(dealId: string) {
  return useQuery({
    queryKey: ["deal-details", dealId],
    queryFn: async () => {
      if (!dealId) return null;

      try {
        const collaborator = await getCurrentUserData();

        const { data, error } = await supabase
          .from("web_deals")
          .select(`
            *,
            company:web_companies(*),
            person:web_people(*),
            stage:web_funnel_stages(*),
            funnel:web_funnels(*)
          `)
          .eq("id", dealId)
          .eq("client_id", collaborator.client_id)
          .single();

        if (error) {
          console.error("Erro ao buscar detalhes do negócio:", error);
          return null;
        }

        // Carregar tarefas
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            id,
            title,
            description,
            due_date,
            completed,
            created_at,
            updated_at,
            type:task_types (*)
          `)
          .eq("deal_id", dealId)
          .order("created_at", { ascending: false });

        if (tasksError) {
          console.error("Erro ao carregar tarefas:", tasksError);
          throw tasksError;
        }

        // Carregar histórico
        const { data: history, error: historyError } = await supabase
          .from("deal_history")
          .select(`
            id,
            action,
            description,
            metadata,
            created_at,
            created_by
          `)
          .eq("deal_id", dealId)
          .order("created_at", { ascending: false });

        if (historyError) {
          console.error("Erro ao carregar histórico:", historyError);
          throw historyError;
        }

        // Carregar pessoas da empresa
        let people = [];
        if (data.company_id) {
          const { data: companyPeople, error: peopleError } = await supabase
            .from("company_people")
            .select(`
              id,
              person:people (
                id,
                name,
                email,
                whatsapp,
                celular,
                role
              )
            `)
            .eq("company_id", data.company_id)
            .eq("client_id", collaborator.client_id)
            .order("created_at", { ascending: false });

          if (peopleError) {
            console.error("Erro ao carregar pessoas:", peopleError);
            throw peopleError;
          }

          people = companyPeople.map(cp => cp.person);
        } else if (data.person_id) {
          const { data: person, error: personError } = await supabase
            .from("people")
            .select("*")
            .eq("id", data.person_id)
            .eq("client_id", collaborator.client_id)
            .single();

          if (personError) {
            console.error("Erro ao carregar pessoa:", personError);
            throw personError;
          }

          people = person ? [person] : [];
        }

        // Processar os dados para manter a estrutura esperada
        const dealData = {
          ...data,
          tasks,
          history,
          people,
          company: data.company ? {
            ...data.company,
            cidade: data.company.cities?.name,
            estado: data.company.states?.name,
            uf: data.company.states?.uf,
            address: {
              cep: data.company.cep,
              rua: data.company.rua,
              numero: data.company.numero,
              complemento: data.company.complemento,
              bairro: data.company.bairro
            }
          } : null
        };

        return dealData as Deal;
      } catch (error) {
        console.error("Erro ao buscar detalhes do negócio:", error);
        return null;
      }
    },
    enabled: !!dealId,
    staleTime: 1000 * 60 * 5, // Dados permanecem fresh por 5 minutos
    cacheTime: 1000 * 60 * 30, // Cache por 30 minutos
  });
}
