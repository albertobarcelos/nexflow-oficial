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

/** Linha retornada pela query em lote de contact_companies com join em contacts */
interface ContactCompanyRow {
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
    contact_type?: string;
  } | Array<{
    id: string;
    client_name: string;
    main_contact: string | null;
    phone_numbers: string[] | null;
    contact_type?: string;
  }>;
}

/**
 * Hook para buscar empresas com suas relações (parceiros e contatos).
 * Usa uma única query em lote em contact_companies para evitar N+1 e net::ERR_FAILED.
 */
export function useCompanyRelations() {
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ["company-relations"],
    queryFn: async (): Promise<CompanyRelation[]> => {
      try {
        const collaborator = await getCurrentUserData();

        // 1) Buscar todas as empresas (uma request)
        const { data: companiesData, error: companiesError } = await supabase
          .from("web_companies")
          .select("id, name, cnpj, razao_social, email, phone")
          .eq("client_id", collaborator.client_id)
          .order("name");

        if (companiesError) {
          console.error("[useCompanyRelations] Erro ao buscar empresas:", companiesError);
          return [];
        }

        if (!companiesData || companiesData.length === 0) {
          return [];
        }

        const companyIds = companiesData.map((c) => c.id);

        // 2) Queries em lotes para evitar 400 por URL longa (limite PostgREST ~2k chars no filter)
        const BATCH_SIZE = 80;
        const relationsRows: ContactCompanyRow[] = [];
        for (let i = 0; i < companyIds.length; i += BATCH_SIZE) {
          const chunk = companyIds.slice(i, i + BATCH_SIZE);
          const { data: chunkData, error: chunkError } = await supabase
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
                phone_numbers,
                contact_type
              )
            `
            )
            .in("company_id", chunk)
            .eq("client_id", collaborator.client_id);

          if (chunkError) {
            console.error("[useCompanyRelations] Erro ao buscar vínculos contact_companies (lote):", chunkError);
            break;
          }
          if (chunkData?.length) {
            relationsRows.push(...(chunkData as unknown as ContactCompanyRow[]));
          }
        }
        const relationsData = relationsRows;

        // Agrupar por company_id para montar partners/contacts por empresa
        const byCompanyId = new Map<string, ContactCompanyRow[]>();
        for (const row of relationsData || []) {
          const r = row as unknown as ContactCompanyRow;
          const list = byCompanyId.get(r.company_id) ?? [];
          list.push(r);
          byCompanyId.set(r.company_id, list);
        }

        // 3) Montar CompanyRelation por empresa a partir do mesmo conjunto de vínculos
        const companiesWithRelations: CompanyRelation[] = companiesData.map((company) => {
          const rows = byCompanyId.get(company.id) ?? [];

          const partners: CompanyPartner[] = rows
            .map((item) => {
              const contact = Array.isArray(item.contact) ? item.contact[0] : item.contact;
              if (!contact) return null;
              return {
                id: item.id,
                partner_id: item.contact_id,
                company_id: item.company_id,
                relationship_type: item.role ?? "",
                partner: {
                  id: contact.id,
                  name: contact.client_name ?? "",
                  email: contact.main_contact ?? "",
                  whatsapp:
                    contact.phone_numbers && contact.phone_numbers.length > 0
                      ? contact.phone_numbers[0]
                      : "",
                  partner_type: "parceiro",
                  status: "active",
                },
              };
            })
            .filter((p): p is CompanyPartner => p !== null);

          const contacts: CompanyContact[] = rows
            .map((item) => {
              const contact = Array.isArray(item.contact) ? item.contact[0] : item.contact;
              if (!contact) return null;
              return {
                id: item.id,
                contact_id: item.contact_id,
                company_id: item.company_id,
                role: item.role,
                is_primary: item.is_primary,
                contact: {
                  id: contact.id,
                  client_name: contact.client_name,
                  main_contact: contact.main_contact,
                  phone_numbers: contact.phone_numbers,
                },
              };
            })
            .filter((c): c is CompanyContact => c !== null);

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
        });

        return companiesWithRelations;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Failed to fetch") || (err as Error)?.name === "TypeError") {
          console.error(
            "[useCompanyRelations] Falha de rede ao buscar relações. Verifique conectividade e URL do Supabase.",
            err
          );
        } else {
          console.error("[useCompanyRelations] Erro ao buscar relações de empresas:", err);
        }
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    companies: companies ?? [],
    isLoading,
    error,
  };
}
