import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Database } from "lucide-react";

export function CustomFieldsLayout() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuração de Campos</h1>
        <p className="text-muted-foreground">
          Personalize os campos para cada tipo de entidade no sistema.
        </p>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        {/* Entity Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entidades</CardTitle>
            <CardDescription>
              Selecione uma entidade para editar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedEntityId("companies")}
              >
                <Database className="w-4 h-4 mr-2" />
                Empresas
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedEntityId("people")}
              >
                <Database className="w-4 h-4 mr-2" />
                Pessoas
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedEntityId("partners")}
              >
                <Database className="w-4 h-4 mr-2" />
                Parceiros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fields Editor */}
        {selectedEntityId ? (
          <Card>
            <CardHeader>
              <CardTitle>Campos Personalizados</CardTitle>
              <CardDescription>
                Adicione, remova e organize os campos personalizados para esta entidade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Campo
                </Button>
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configuração de campos em desenvolvimento...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-[500px] text-muted-foreground">
            Selecione uma entidade para começar a editar seus campos
          </Card>
        )}
      </div>
    </div>
  );
}
