import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";

export interface CompanyPartner {
  id: string;
  partner_id: string;
  company_id: string;
  relationship_type: string;
  partner: {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    partner_type: string;
    status: string;
  };
}

export interface CompanyContact {
  id: string;
  contact_id: string;
  company_id: string;
  role: string | null;
  is_primary: boolean;
  contact: {
    id: string;
    client_name: string;
    email: string | null;
    phone_numbers: string[] | null;
  };
}

export interface CompanyRelation {
  id: string;
  name: string;
  cnpj: string | null;
  razao_social: string | null;
  email: string | null;
  phone: string | null;
  partners: CompanyPartner[];
  contacts: CompanyContact[];
  partnersCount: number;
  contactsCount: number;
}

/**
 * Hook para buscar empresas com suas relações (parceiros e contatos)
 */
export function useCompanyRelations() {
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ["company-relations"],
    queryFn: async (): Promise<CompanyRelation[]> => {
      try {
        const collaborator = await getCurrentUserData();

        // Buscar todas as empresas
        const { data: companiesData, error: companiesError } = await supabase
          .from("web_companies")
          .select("id, name, cnpj, razao_social, email, phone")
          .eq("client_id", collaborator.client_id)
          .order("name");

        if (companiesError) {
          console.error("Erro ao buscar empresas:", companiesError);
          return [];
        }

        if (!companiesData || companiesData.length === 0) {
          return [];
        }

        // Para cada empresa, buscar parceiros e contatos vinculados
        const companiesWithRelations = await Promise.all(
          companiesData.map(async (company) => {
            // Buscar parceiros vinculados via web_company_partners
            const { data: partnersData } = await supabase
              .from("web_company_partners" as any)
              .select(
                `
                id,
                partner_id,
                company_id,
                relationship_type,
                partner:web_partners(
                  id,
                  name,
                  email,
                  whatsapp,
                  partner_type,
                  status
                )
              `
              )
              .eq("company_id", company.id)
              .eq("client_id", collaborator.client_id);

            // Buscar contatos vinculados via contact_companies
            const { data: contactsData } = await supabase
              .from("contact_companies")
              .select(
                `
                id,
                contact_id,
                company_id,
                role,
                is_primary,
                contact:contacts(
                  id,
                  client_name,
                  email,
                  phone_numbers
                )
              `
              )
              .eq("company_id", company.id)
              .eq("client_id", collaborator.client_id);

            // Processar parceiros
            const partners: CompanyPartner[] = (partnersData || []).map((item: any) => ({
              id: item.id,
              partner_id: item.partner_id,
              company_id: item.company_id,
              relationship_type: item.relationship_type,
              partner: Array.isArray(item.partner) ? item.partner[0] : item.partner,
            })).filter((p: CompanyPartner) => p.partner); // Filtrar parceiros válidos

            // Processar contatos
            const contacts: CompanyContact[] = (contactsData || []).map((item: any) => ({
              id: item.id,
              contact_id: item.contact_id,
              company_id: item.company_id,
              role: item.role,
              is_primary: item.is_primary,
              contact: Array.isArray(item.contact) ? item.contact[0] : item.contact,
            })).filter((c: CompanyContact) => c.contact); // Filtrar contatos válidos

            return {
              id: company.id,
              name: company.name,
              cnpj: company.cnpj,
              razao_social: company.razao_social,
              email: company.email,
              phone: company.phone,
              partners,
              contacts,
              partnersCount: partners.length,
              contactsCount: contacts.length,
            } as CompanyRelation;
          })
        );

        return companiesWithRelations;
      } catch (error) {
        console.error("Erro ao buscar relações de empresas:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    companies: companies || [],
    isLoading,
    error,
  };
}

