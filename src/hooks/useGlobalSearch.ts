import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";

/** Resultado de card para a busca global */
export interface CardSearchResult {
  type: "card";
  id: string;
  title: string;
  subtitle?: string;
  flowId: string;
  href: string;
}

/** Resultado de contato para a busca global */
export interface ContactSearchResult {
  type: "contact";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

/** Resultado de empresa para a busca global */
export interface CompanySearchResult {
  type: "company";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

/** Resultado de etapa (cards na etapa) para a busca global */
export interface StageSearchResult {
  type: "stage";
  id: string;
  title: string;
  subtitle?: string;
  flowId: string;
  href: string;
}

export type GlobalSearchResult =
  | CardSearchResult
  | ContactSearchResult
  | CompanySearchResult
  | StageSearchResult;

export interface GlobalSearchData {
  cards: CardSearchResult[];
  contacts: ContactSearchResult[];
  companies: CompanySearchResult[];
  stageCards: CardSearchResult[];
}

const CARD_LIMIT = 20;
const CONTACT_LIMIT = 15;
const COMPANY_LIMIT = 15;
const STAGE_LIMIT = 10;

/** Normaliza string para busca (remove acentos, lowercase) */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Verifica se o termo está presente em field_values (JSONB) */
function fieldValuesContainQuery(
  fieldValues: Record<string, unknown> | null,
  query: string
): boolean {
  if (!fieldValues || typeof fieldValues !== "object") return false;
  const normalizedQuery = normalizeForSearch(query);
  const str = Object.values(fieldValues)
    .map((v) => {
      if (v == null) return "";
      if (typeof v === "string") return v;
      if (typeof v === "number") return String(v);
      if (Array.isArray(v)) return v.join(" ");
      return JSON.stringify(v);
    })
    .join(" ");
  return normalizeForSearch(str).includes(normalizedQuery);
}

/**
 * Hook para busca global em cards, contatos, empresas e etapas.
 * Todas as buscas são filtradas por client_id.
 */
export function useGlobalSearch(query: string, clientId: string | null) {
  const trimmedQuery = query.trim();
  const enabled = trimmedQuery.length >= 2 && Boolean(clientId);

  return useQuery({
    queryKey: ["global-search", clientId, trimmedQuery],
    queryFn: async (): Promise<GlobalSearchData> => {
      const client = nexflowClient();
      const q = trimmedQuery;
      const pattern = `%${q}%`;

      // Executa buscas em paralelo
      const [cardsRes, contactsRes, companiesRes, stagesRes] = await Promise.all([
        // Cards: por título (field_values filtrado no cliente abaixo)
        client
          .from("cards")
          .select("id, title, flow_id, step_id, field_values")
          .eq("client_id", clientId!)
          .ilike("title", pattern)
          .limit(CARD_LIMIT)
          .order("updated_at", { ascending: false }),

        // Contatos: client_name e main_contact
        client
          .from("contacts")
          .select("id, client_name, main_contact, company_names")
          .eq("client_id", clientId!)
          .or(`client_name.ilike.${pattern},main_contact.ilike.${pattern}`)
          .limit(CONTACT_LIMIT)
          .order("client_name", { ascending: true }),

        // Empresas: name e razao_social
        client
          .from("web_companies")
          .select("id, name, razao_social")
          .eq("client_id", clientId!)
          .or(`name.ilike.${pattern},razao_social.ilike.${pattern}`)
          .limit(COMPANY_LIMIT)
          .order("name", { ascending: true }),

        // Etapas: nome da etapa
        client
          .from("web_flow_stages")
          .select("id, name, flow_id")
          .eq("client_id", clientId!)
          .ilike("name", pattern)
          .limit(STAGE_LIMIT)
          .order("order_index", { ascending: true }),
      ]);

      // Processa cards
      let cardsRaw = cardsRes.data ?? [];
      const cardsError = cardsRes.error;
      if (cardsError) {
        console.error("Erro ao buscar cards na busca global:", cardsError);
      }

      // Busca adicional: cards por field_values (JSONB não suporta ilike)
      const { data: cardsByFieldValues } = await client
        .from("cards")
        .select("id, title, flow_id, step_id, field_values")
        .eq("client_id", clientId!)
        .limit(100);

      const cardIdsSeen = new Set<string>(cardsRaw.map((c) => c.id));
      for (const card of cardsByFieldValues ?? []) {
        if (cardIdsSeen.has(card.id)) continue;
        if (fieldValuesContainQuery(card.field_values as Record<string, unknown>, q)) {
          cardsRaw.push(card);
          cardIdsSeen.add(card.id);
          if (cardsRaw.length >= CARD_LIMIT) break;
        }
      }

      const cards: CardSearchResult[] = cardsRaw.slice(0, CARD_LIMIT).map((c) => ({
        type: "card" as const,
        id: c.id,
        title: c.title,
        flowId: c.flow_id,
        href: `/crm/flows/${c.flow_id}/board`,
      }));

      // Processa contatos: buscar flow_id do primeiro card vinculado
      const contactIds = (contactsRes.data ?? []).map((c) => c.id);
      let contactFlowMap: Record<string, string> = {};

      if (contactIds.length > 0) {
        const { data: contactCards } = await client
          .from("cards")
          .select("contact_id, flow_id")
          .in("contact_id", contactIds)
          .order("updated_at", { ascending: false });

        for (const row of contactCards ?? []) {
          if (row.contact_id && !contactFlowMap[row.contact_id]) {
            contactFlowMap[row.contact_id] = row.flow_id;
          }
        }
      }

      const contacts: ContactSearchResult[] = (contactsRes.data ?? [])
        .slice(0, CONTACT_LIMIT)
        .map((c) => {
        const flowId = contactFlowMap[c.id];
        const href = flowId
          ? `/crm/flow/${flowId}/contacts/${c.id}`
          : "/crm/contacts";
        return {
          type: "contact" as const,
          id: c.id,
          title: c.client_name,
          subtitle: c.main_contact || undefined,
          href,
        };
      });

      // Empresas
      const companies: CompanySearchResult[] = (companiesRes.data ?? []).map((c) => ({
        type: "company" as const,
        id: c.id,
        title: c.name,
        subtitle: c.razao_social ?? undefined,
        href: "/crm/companies/relations",
      }));

      // Etapas: buscar cards em cada etapa e retornar como cards (links para board)
      const stageCards: CardSearchResult[] = [];
      for (const stage of stagesRes.data ?? []) {
        const { data: stageCardsData } = await client
          .from("cards")
          .select("id, title, flow_id")
          .eq("step_id", stage.id)
          .eq("client_id", clientId!)
          .limit(5)
          .order("position", { ascending: true });

        for (const card of stageCardsData ?? []) {
          stageCards.push({
            type: "card" as const,
            id: card.id,
            title: card.title,
            subtitle: stage.name,
            flowId: card.flow_id,
            href: `/crm/flows/${card.flow_id}/board`,
          });
          if (stageCards.length >= 15) break;
        }
        if (stageCards.length >= 15) break;
      }

      return {
        cards,
        contacts,
        companies,
        stageCards,
      };
    },
    enabled,
    staleTime: 1000 * 60,
  });
}
