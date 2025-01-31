import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCustomFields } from "@/hooks/useCustomFields";
import { AddCustomFieldDialog } from "../../entities/components/AddCustomFieldDialog";
import { CustomFieldsList } from "./CustomFieldsList";

interface EntityFieldsEditorProps {
  entityType: "companies" | "contacts" | "partners";
}

export function EntityFieldsEditor({ entityType }: EntityFieldsEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { fields, isLoading } = useCustomFields(entityType);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Campos Personalizados</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os campos personalizados desta entidade
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Campo
        </Button>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <CustomFieldsList fields={fields} entityType={entityType} />
      </ScrollArea>

      <AddCustomFieldDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        entityType={entityType}
      />
    </div>
  );
}
