import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OrganizationLicense {
  id: string;
  name: string;
  user_quantity: number;
}

export function useOrganizationLicenses() {
  return useQuery({
    queryKey: ["organization-licenses"],
    queryFn: async () => {
      try {
        // Buscar todas as licenças da tabela core_licenses
        const { data: licenses, error } = await supabase
          .from("core_licenses")
          .select(`
            id,
            name,
            user_quantity
          `)
          .order("name");

        if (error) {
          console.error("Erro ao buscar licenças:", error);
          return [];
        }

        return (licenses || []).map((license: any) => ({
          id: license.id,
          name: license.name,
          user_quantity: license.user_quantity,
        }));
      } catch (error) {
        console.error("Erro ao buscar licenças:", error);
        return [];
      }
    },
  });
}
