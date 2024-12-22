import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pipeline Principal</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Etapa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto p-4">
            <Card className="w-64 shrink-0 border-2 border-blue-200">
              <CardHeader className="flex flex-row items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">Aguardando pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cliente aguardando confirmação do pagamento
                </p>
              </CardContent>
            </Card>

            <Card className="w-64 shrink-0 border-2 border-green-200">
              <CardHeader className="flex flex-row items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">Pagamento efetuado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pagamento confirmado, aguardando próxima etapa
                </p>
              </CardContent>
            </Card>

            <Card className="w-64 shrink-0 border-2 border-yellow-200">
              <CardHeader className="flex flex-row items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">Primeiro contato</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Realizar primeiro contato com o cliente
                </p>
              </CardContent>
            </Card>

            <Card className="w-64 shrink-0 border-2 border-purple-200">
              <CardHeader className="flex flex-row items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">Captando dados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Levantamento de informações do cliente
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pipeline de Pós-venda</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Etapa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto p-4">
            <Card className="w-64 shrink-0 border-2 border-blue-200">
              <CardHeader className="flex flex-row items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">Implementação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Processo de implementação do sistema
                </p>
              </CardContent>
            </Card>

            <Card className="w-64 shrink-0 border-2 border-green-200">
              <CardHeader className="flex flex-row items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">Treinamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Treinamento da equipe do cliente
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}