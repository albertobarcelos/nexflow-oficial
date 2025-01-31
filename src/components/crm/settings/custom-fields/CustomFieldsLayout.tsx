import { useState } from "react";
import { EntityField } from "./types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { EntitySelector } from "./components/EntitySelector";
import { EntityFieldsEditor } from "./components/EntityFieldsEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomFields } from "@/hooks/useCustomFields";

export function CustomFieldsLayout() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { fields, isLoading, updateFields } = useCustomFields(selectedEntityId);

  const handleSelectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
  };

  const handleSave = async (updatedFields: EntityField[]) => {
    if (!selectedEntityId) {
      toast.error("Nenhuma entidade selecionada");
      return;
    }

    try {
      await updateFields(updatedFields);
      toast.success("Campos atualizados com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar campos");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuração de Campos</h1>
        <p className="text-muted-foreground">
          Personalize os campos para cada tipo de entidade no sistema.
        </p>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        <EntitySelector
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
        />

        {selectedEntityId ? (
          <Card>
            <CardHeader>
              <CardTitle>Campos Personalizados</CardTitle>
              <CardDescription>
                Adicione, remova e organize os campos personalizados para esta entidade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntityFieldsEditor
                entityId={selectedEntityId}
                fields={fields}
                isLoading={isLoading}
                onSave={handleSave}
              />
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
