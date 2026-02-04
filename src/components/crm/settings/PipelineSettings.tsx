import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Settings } from "lucide-react";

export function PipelineSettings() {
  const { hasAccess, accessError, currentClient, isLoading } = useClientAccessGuard();

  useEffect(() => {
    if (hasAccess && currentClient?.name) {
      console.log(
        `[AUDIT] Settings (pipeline) - Client: ${currentClient.name}`
      );
    }
  }, [hasAccess, currentClient?.name]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {accessError ??
            "Cliente não definido. Não é possível acessar as configurações de pipeline."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Pipeline
          </CardTitle>
          <CardDescription>
            Configure os pipelines e etapas do seu CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Pipelines</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie os pipelines de vendas
                </p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Pipeline
              </Button>
            </div>
            
            <div className="text-center py-8 text-muted-foreground">
              <p>Configurações de pipeline em desenvolvimento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
