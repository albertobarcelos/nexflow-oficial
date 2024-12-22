import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function CustomFieldsSettings() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campos Personalizados</h2>
          <p className="text-muted-foreground">
            Adicione campos customizados aos seus formulários
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Campo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campos de Lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-2 hover:bg-muted rounded-lg">
              <div>
                <p className="font-medium">Origem do Lead</p>
                <p className="text-sm text-muted-foreground">Seleção</p>
              </div>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-muted rounded-lg">
              <div>
                <p className="font-medium">Orçamento</p>
                <p className="text-sm text-muted-foreground">Número</p>
              </div>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campos de Oportunidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-2 hover:bg-muted rounded-lg">
              <div>
                <p className="font-medium">Tipo de Contrato</p>
                <p className="text-sm text-muted-foreground">Seleção</p>
              </div>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-muted rounded-lg">
              <div>
                <p className="font-medium">Data Prevista</p>
                <p className="text-sm text-muted-foreground">Data</p>
              </div>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}