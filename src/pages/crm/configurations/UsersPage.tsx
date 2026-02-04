import { CompanyUsersManager } from "@/components/admin/users/CompanyUsersManager";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useEffect } from "react";

export function UsersPage() {
  const { hasAccess, accessError, currentClient } = useClientAccessGuard();

  useEffect(() => {
    if (hasAccess && currentClient?.id) {
      console.info("[AUDIT] Configurações (users) - Client:", currentClient.id);
    }
  }, [hasAccess, currentClient?.id]);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-destructive">
          <p className="font-medium">Sem acesso às configurações</p>
          <p className="text-sm text-muted-foreground mt-1">{accessError ?? "Cliente não definido"}</p>
        </div>
      </div>
    );
  }

  const clientId = currentClient?.id;
  const companyName = currentClient?.companyName ?? currentClient?.name ?? "Empresa";

  if (!clientId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando informações da empresa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários da sua empresa
        </p>
      </div>
      <CompanyUsersManager clientId={clientId} companyName={companyName} />
    </div>
  );
}
