import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";
import type { OrganizationUser } from "./useOrganizationUsers";

/**
 * Usuários da empresa do cliente atual (multi-tenant seguro).
 * Usa useSecureClientQuery: clientId do store, queryKey com clientId, validação dupla.
 */
export function useCompanyUsers() {
  return useSecureClientQuery<OrganizationUser[]>({
    queryKey: ["company-users"],
    queryFn: async (client, clientId) => {
      const { data: users, error } = await client
        .from("core_client_users")
        .select(
          `
          id,
          name,
          surname,
          email,
          role,
          is_active,
          client_id,
          avatar_url,
          custom_avatar_url,
          avatar_type,
          avatar_seed,
          core_clients:client_id (
            id,
            name,
            company_name
          )
        `
        )
        .eq("client_id", clientId)
        .order("name");

      if (error) {
        console.error("Erro ao buscar usuários da empresa:", error);
        return [];
      }

      return (users || []).map((user: Record<string, unknown>) => {
        const company = user.core_clients as
          | { company_name?: string; name?: string }
          | null;
        return {
          id: user.id as string,
          name: (user.name as string) || "",
          surname: (user.surname as string) || "",
          email: user.email as string,
          role: user.role as string,
          is_active: user.is_active as boolean,
          client_id: user.client_id as string,
          company_name: company?.company_name || company?.name || "Sem empresa",
          avatar_url: user.avatar_url as string | null,
          custom_avatar_url: user.custom_avatar_url as string | null,
          avatar_type: user.avatar_type as string | null,
          avatar_seed: user.avatar_seed as string | null,
        };
      });
    },
    validateClientIdOnData: true,
    queryOptions: {
      refetchOnWindowFocus: false,
    },
  });
}
