import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";

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
  client_id?: string;
  contact: {
    id: string;
    client_name: string;
    main_contact: string | null;
    phone_numbers: string[] | null;
    contact_type?: string | string[];
  } | Array<{
    id: string;
    client_name: string;
    main_contact: string | null;
    phone_numbers: string[] | null;
    contact_type?: string | string[];
  }>;
}

/** Tipo da empresa retornada pelo select (com client_id para validação) */
interface WebCompanyRow {
  id: string;
  name: string;
  cnpj: string | null;
  razao_social: string | null;
  email: string | null;
  phone: string | null;
  client_id: string;
}

/**
 * Hook para buscar empresas com suas relações (parceiros e contatos).
 * Usa useSecureClientQuery com clientId na queryKey e validação dupla por client_id.
 * Consultas em lote em contact_companies para evitar N+1 e limite de URL do PostgREST.
 */
export function useCompanyRelations() {
  const {
    data: companies = [],
    isLoading,
    error,
  } = useSecureClientQuery<CompanyRelation[]>({
    queryKey: ["company-relations"],
    queryFn: async (client, clientId) => {
      try {
        // 1) Buscar todas as empresas do cliente (com client_id para validação)
        const { data: companiesData, error: companiesError } = await client
          .from("web_companies")
          .select("id, name, cnpj, razao_social, email, phone, client_id")
          .eq("client_id", clientId)
          .order("name");

        if (companiesError) {
          console.error(
            "[useCompanyRelations] Erro ao buscar empresas:",
            companiesError
          );
          return [];
        }

        const companiesRows = (companiesData || []) as WebCompanyRow[];
        const invalidCompanies = companiesRows.filter(
          (c) => c.client_id !== clientId
        );
        if (invalidCompanies.length > 0) {
          console.error(
            "[SECURITY] Empresas de outro cliente detectadas:",
            invalidCompanies.length
          );
          throw new Error(
            "Violação de segurança: dados de outro cliente detectados"
          );
        }

        if (companiesRows.length === 0) {
          return [];
        }

        const companyIds = companiesRows.map((c) => c.id);

        // 2) Queries em lotes para evitar 400 por URL longa (limite PostgREST ~2k chars)
        const BATCH_SIZE = 80;
        const relationsRows: ContactCompanyRow[] = [];
        for (let i = 0; i < companyIds.length; i += BATCH_SIZE) {
          const chunk = companyIds.slice(i, i + BATCH_SIZE);
          const { data: chunkData, error: chunkError } = await client
            .from("contact_companies")
            .select(
              `
              id,
              contact_id,
              company_id,
              role,
              is_primary,
              client_id,
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
            .eq("client_id", clientId);

          if (chunkError) {
            console.error(
              "[useCompanyRelations] Erro ao buscar vínculos contact_companies (lote):",
              chunkError
            );
            break;
          }

          const rows = (chunkData || []) as ContactCompanyRow[];
          const invalidRelations = rows.filter(
            (r) => r.client_id !== undefined && r.client_id !== clientId
          );
          if (invalidRelations.length > 0) {
            console.error(
              "[SECURITY] Relações contact_companies de outro cliente detectadas:",
              invalidRelations.length
            );
            throw new Error(
              "Violação de segurança: dados de outro cliente detectados"
            );
          }
          relationsRows.push(...rows);
        }

        // 3) Agrupar por company_id para montar partners/contacts por empresa
        const byCompanyId = new Map<string, ContactCompanyRow[]>();
        for (const row of relationsRows) {
          const list = byCompanyId.get(row.company_id) ?? [];
          list.push(row);
          byCompanyId.set(row.company_id, list);
        }

        // 4) Montar CompanyRelation por empresa
        const companiesWithRelations: CompanyRelation[] = companiesRows.map(
          (company) => {
            const rows = byCompanyId.get(company.id) ?? [];

            const partners: CompanyPartner[] = rows
              .map((item) => {
                const contact = Array.isArray(item.contact)
                  ? item.contact[0]
                  : item.contact;
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
                const contact = Array.isArray(item.contact)
                  ? item.contact[0]
                  : item.contact;
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
            };
          }
        );

        return companiesWithRelations;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Violação de segurança")) {
          throw err;
        }
        if (
          message.includes("Failed to fetch") ||
          (err as Error)?.name === "TypeError"
        ) {
          console.error(
            "[useCompanyRelations] Falha de rede ao buscar relações. Verifique conectividade e URL do Supabase.",
            err
          );
        } else {
          console.error(
            "[useCompanyRelations] Erro ao buscar relações de empresas:",
            err
          );
        }
        return [];
      }
    },
    queryOptions: {
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  });

  return {
    companies,
    isLoading,
    error,
  };
}
