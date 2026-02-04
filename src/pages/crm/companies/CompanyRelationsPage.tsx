import { useEffect } from "react";
import { CompanyRelationsTable } from "@/components/crm/companies/CompanyRelationsTable";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2 } from "lucide-react";

export function CompanyRelationsPage() {
  const { hasAccess, accessError, currentClient } = useClientAccessGuard();

  // Auditoria: registro de acesso à página Relações de Empresas
  useEffect(() => {
    if (hasAccess && currentClient?.name) {
      console.log(
        `[AUDIT] Relações de empresas - Client: ${currentClient.name}`
      );
    }
  }, [hasAccess, currentClient?.name]);

  if (!hasAccess) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {accessError ??
              "Cliente não definido. Não é possível acessar as relações de empresas."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Relações de Empresas
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Visualize e gerencie as relações entre empresas, parceiros e
                contatos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <CompanyRelationsTable />
    </div>
  );
}


