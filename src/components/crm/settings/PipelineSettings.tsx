import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function PipelineSettings() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pipelines</h2>
          <p className="text-muted-foreground">
            Configure seus pipelines de vendas
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pipeline
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto p-4">
            <Card className="w-64 shrink-0">
              <CardHeader>
                <CardTitle className="text-sm">Primeiro Contato</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Lead inicial qualificado
                </p>
              </CardContent>
            </Card>

            <Card className="w-64 shrink-0">
              <CardHeader>
                <CardTitle className="text-sm">Apresentação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Demonstração do produto
                </p>
              </CardContent>
            </Card>

            <Card className="w-64 shrink-0">
              <CardHeader>
                <CardTitle className="text-sm">Proposta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Negociação de valores
                </p>
              </CardContent>
            </Card>

            <Card className="w-64 shrink-0">
              <CardHeader>
                <CardTitle className="text-sm">Fechamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Finalização do contrato
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}