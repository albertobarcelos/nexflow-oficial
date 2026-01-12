import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Indication } from "@/types/indications";

export function useIndicationById(indicationId: string | null | undefined) {
  return useQuery({
    queryKey: ["indication", indicationId],
    queryFn: async (): Promise<Indication | null> => {
      if (!indicationId) {
        return null;
      }

      // Buscar indicação
      const { data: indication, error } = await supabase
        .from("core_indications")
        .select("*")
        .eq("id", indicationId)
        .single();

      if (error || !indication) {
        console.error("Erro ao buscar indicação:", error);
        return null;
      }

      // Buscar informações do hunter
      let hunter = null;
      if (indication.hunter_id) {
        const { data: hunterData } = await supabase
          .schema("nexhunters")
          .from("hunters")
          .select("*")
          .eq("id", indication.hunter_id)
          .single();

        if (hunterData && hunterData.client_users_id) {
          // Buscar informações do usuário relacionado
          const { data: userData } = await supabase
            .from("core_client_users")
            .select("name, email")
            .eq("id", hunterData.client_users_id)
            .single();

          hunter = {
            id: hunterData.id,
            name: userData?.name || null,
            email: userData?.email || null,
          };
        }
      }

      return {
        ...indication,
        hunter: hunter,
      };
    },
    enabled: !!indicationId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

