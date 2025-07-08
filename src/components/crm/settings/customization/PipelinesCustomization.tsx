import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PipelinesCustomization() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuração de Pipelines</h1>
        <p className="text-muted-foreground">
          Configure os pipelines e etapas do seu CRM.
        </p>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* Lista de Pipelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipelines</CardTitle>
            <CardDescription>
              Selecione um pipeline para configurar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedPipelineId("vendas")}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Pipeline de Vendas
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedPipelineId("suporte")}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Pipeline de Suporte
              </Button>
            </div>
            <div className="mt-4">
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Novo Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Área de Configuração */}
        {selectedPipelineId ? (
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Pipeline</CardTitle>
              <CardDescription>
                Configure as etapas e campos do pipeline selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configuração de pipelines em desenvolvimento...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-[500px] text-muted-foreground">
            Selecione um pipeline para começar a configurar
          </Card>
        )}
      </div>
    </div>
  );
}
