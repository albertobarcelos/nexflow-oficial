import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import { Opportunity } from "@/hooks/useOpportunities";

export function useOpportunityById(opportunityId: string | null | undefined) {
  return useQuery({
    queryKey: ["opportunities", opportunityId],
    queryFn: async (): Promise<Opportunity | null> => {
      if (!opportunityId) {
        return null;
      }

      // Buscar oportunidade usando a mesma lógica do useOpportunities
      // Por enquanto, vamos buscar diretamente da tabela
      const { data, error } = await nexflowClient()
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId)
        .single();

      if (error || !data) {
        console.error("Erro ao buscar oportunidade:", error);
        return null;
      }

      // Mapear para o tipo Opportunity
      // Nota: Isso pode precisar ser ajustado baseado na estrutura real da tabela
      return {
        id: data.id,
        client_id: data.client_id,
        client_name: (data as any).client_name || (data as any).name || "",
        main_contact: (data as any).main_contact || "",
        phone_numbers: (data as any).phone_numbers || [],
        company_names: (data as any).company_names || [],
        tax_ids: (data as any).tax_ids || [],
        related_card_ids: (data as any).related_card_ids || [],
        assigned_team_id: (data as any).assigned_team_id || null,
        avatar_type: (data as any).avatar_type,
        avatar_seed: (data as any).avatar_seed,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: (data as any).updated_at || new Date().toISOString(),
      };
    },
    enabled: !!opportunityId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}


