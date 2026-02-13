import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useNexflowFlow } from "@/hooks/useNexflowFlows";
import { FlowDashboardWrapper } from "@/features/nexflow/dashboard";
import { cn } from "@/lib/utils";

/**
 * Página do dashboard dinâmico por flow.
 * Carrega o flow, obtém a categoria e renderiza o dashboard correspondente (vendas, onboarding ou genérico).
 */
export function FlowDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAccess, accessError } = useClientAccessGuard();
  const { flow, isLoading } = useNexflowFlow(id);

  const handleGoBack = () => {
    navigate("/crm/flows");
  };

  if (!hasAccess) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-destructive">
          <p className="font-medium">Sem acesso ao dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">
            {accessError ?? "Cliente não definido"}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !id) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="font-medium">Flow não encontrado</p>
          <Button variant="link" onClick={handleGoBack}>
            Voltar aos flows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-screen bg-neutral-50 text-neutral-600 font-sans")}
    >
      <header className="border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
          <span className="text-xs font-medium text-neutral-400">
            DASHBOARD DO FLOW
          </span>
          <div className="h-4 w-px bg-neutral-200" />
          <h1 className="text-xl font-bold text-neutral-800">{flow.name}</h1>
        </div>
      </header>
      <main className="p-6">
        <FlowDashboardWrapper flowId={id} category={flow.category} />
      </main>
    </div>
  );
}
