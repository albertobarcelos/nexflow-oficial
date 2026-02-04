import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClientStore } from "@/stores/clientStore";
import { Deal } from "@/types/deals";


/**
 * Detalhes do deal (multi-tenant: queryKey com clientId).
 */
export function useDealDetails(dealId: string) {
  const clientId = useClientStore((s) => s.currentClient?.id ?? null);

  return useQuery({
    queryKey: ["deal-details", clientId, dealId],
    queryFn: async () => {
      if (!dealId) return null;
      if (!clientId) return null;

      try {
        const { data, error } = await supabase
          .from("web_deals")
          .select(`
            *,
            company:web_companies(*),
            person:web_people(*),
            stage:web_flow_stages(*),
            funnel:web_flows(*)
          `)
          .eq("id", dealId)
          .eq("client_id", clientId)
          .single();

        if (error) {
          console.error("Erro ao buscar detalhes do negócio:", error);
          return null;
        }

        // Carregar tarefas (tabela fora do tipo Database gerado)
        const { data: tasks, error: tasksError } = await (supabase as any)
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

        // Carregar histórico (tabela fora do tipo Database gerado)
        const { data: history, error: historyError } = await (supabase as any)
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
          const { data: companyPeople, error: peopleError } = await (supabase as any)
            .from("web_company_people")
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
            .eq("client_id", clientId)
            .order("created_at", { ascending: false });

          if (peopleError) {
            console.error("Erro ao carregar pessoas:", peopleError);
            throw peopleError;
          }

          people = companyPeople.map(cp => cp.person);
        } else if (data.person_id) {
          const { data: person, error: personError } = await (supabase as any)
            .from("people")
            .select("*")
            .eq("id", data.person_id)
            .eq("client_id", clientId)
            .single();

          if (personError) {
            console.error("Erro ao carregar pessoa:", personError);
            throw personError;
          }

          people = person ? [person] : [];
        }

        // Processar os dados para manter a estrutura esperada (company pode ter relations cities/states não tipadas)
        const company = data.company as Record<string, unknown> | null;
        const dealData = {
          ...data,
          tasks,
          history,
          people,
          company: company
            ? {
                ...company,
                cidade: (company as { cities?: { name?: string } }).cities?.name,
                estado: (company as { states?: { name?: string; uf?: string } }).states?.name,
                uf: (company as { states?: { uf?: string } }).states?.uf,
                address: {
                  cep: company.cep,
                  rua: company.rua,
                  numero: company.numero,
                  complemento: company.complemento,
                  bairro: company.bairro,
                },
              }
            : null,
        };

        return dealData as unknown as Deal;
      } catch (error) {
        console.error("Erro ao buscar detalhes do negócio:", error);
        return null;
      }
    },
    enabled: !!clientId && !!dealId,
    staleTime: 1000 * 60 * 5, // Dados permanecem fresh por 5 minutos
    gcTime: 1000 * 60 * 30, // Cache por 30 minutos (anteriormente cacheTime)
  });
}
