import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";

export interface OrganizationUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  is_active: boolean;
  client_id?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  custom_avatar_url?: string | null;
  avatar_type?: string | null;
  avatar_seed?: string | null;
}

/**
 * Usuários da organização do cliente atual (multi-tenant seguro).
 * Filtra por client_id e usa validação dupla nos dados retornados.
 */
export function useOrganizationUsers() {
  return useSecureClientQuery<OrganizationUser[]>({
    queryKey: ["organization-users"],
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
        console.error("Erro ao buscar usuários:", error);
        return [];
      }

      return (users || []).map((user: Record<string, unknown>) => {
        const company = user.core_clients as { company_name?: string; name?: string } | null;
        return {
          id: user.id as string,
          name: (user.name as string) || "",
          surname: (user.surname as string) || "",
          email: user.email as string,
          role: user.role as string,
          is_active: user.is_active as boolean,
          client_id: user.client_id as string | null,
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
