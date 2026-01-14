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
    main_contact: string | null;
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
            // Buscar parceiros vinculados via contact_companies + contacts
            // TODOS os contatos relacionados via contact_companies são considerados parceiros
            let partnersData = null;
            try {
              // Buscar todos os relacionamentos contact_companies para esta empresa
              const { data: allRelations, error } = await supabase
                .from("contact_companies")
                .select(
                  `
                  id,
                  contact_id,
                  company_id,
                  role,
                  contact:contacts(
                    id,
                    client_name,
                    main_contact,
                    phone_numbers,
                    contact_type
                  )
                `
                )
                .eq("company_id", company.id)
                .eq("client_id", collaborator.client_id);
              
              if (error) {
                console.error("Erro ao buscar parceiros:", error);
                partnersData = [];
              } else {
                // Mostrar TODOS os relacionamentos como parceiros (independente de terem a tag)
                partnersData = allRelations || [];
              }
            } catch (err: any) {
              console.error(`[useCompanyRelations] Erro ao buscar parceiros para company ${company.id}:`, err);
              partnersData = [];
            }

            // Buscar contatos vinculados via contact_companies
            // A tabela contacts não tem coluna 'email', usar 'main_contact' ou remover
            let contactsData = null;
            try {
              const { data, error } = await supabase
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
                    main_contact,
                    phone_numbers
                  )
                `
                )
                .eq("company_id", company.id)
                .eq("client_id", collaborator.client_id);
              
              if (error) {
                console.error("Erro ao buscar contatos:", error);
                contactsData = [];
              } else {
                contactsData = data;
              }
            } catch (err: any) {
              console.error(`[useCompanyRelations] Erro ao buscar contatos para company ${company.id}:`, err);
              contactsData = [];
            }

            // Processar parceiros - mapear de contact_companies + contacts para CompanyPartner
            const partners: CompanyPartner[] = (partnersData || []).map((item: any) => {
              const contact = Array.isArray(item.contact) ? item.contact[0] : item.contact;
              if (!contact) return null;

              return {
                id: item.id, // id de contact_companies
                partner_id: item.contact_id, // contact_id
                company_id: item.company_id,
                relationship_type: item.role || '', // role de contact_companies
                partner: {
                  id: contact.id,
                  name: contact.client_name || '',
                  email: contact.main_contact || '',
                  whatsapp: (contact.phone_numbers && contact.phone_numbers.length > 0) ? contact.phone_numbers[0] : '',
                  partner_type: 'parceiro',
                  status: 'active', // Padrão para parceiros
                },
              };
            }).filter((p: CompanyPartner | null): p is CompanyPartner => p !== null); // Filtrar parceiros válidos

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

