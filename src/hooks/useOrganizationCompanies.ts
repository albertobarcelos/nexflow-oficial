import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface OrganizationCompany {
  id: string;
  name: string;
  cpf_cnpj: string | null;
  email: string | null;
  status: string | null;
  company_name: string | null;
  contact_name: string | null;
  license_id: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;

  
}

export function useOrganizationCompanies() {
  return useQuery({
    queryKey: ["organization-companies"],
    queryFn: async () => {
      try {
        // Buscar todas as empresas
        const { data: companies, error } = await supabase
          .from("core_clients")
          .select(`
            id,
            name,
            email,
            status,
            company_name,
            contact_name,
            license_id,
            cpf_cnpj,
            phone,
            city,
            state
          `)
          .order("company_name");

        if (error) {
          console.error("Erro ao buscar empresas:", error);
          return [];
        }

        return (companies || []).map((company: any) => ({
          id: company.id,
          name: company.name,
          cpf_cnpj: company.cpf_cnpj,
          email: company.email,
          status: company.status,
          company_name: company.company_name,
          contact_name: company.contact_name,
          license_id: company.license_id,
          phone: company.phone,
          city: company.city,
          state: company.state,
        }));
      } catch (error) {
        console.error("Erro ao buscar empresas:", error);
        return [];
      }
    },
  });
}