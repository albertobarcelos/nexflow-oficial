import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFields } from "@/hooks/useFields";
import { AddFieldDialog } from "@/components/crm/fields/AddFieldDialog";
import { FieldValueCard } from "@/components/crm/fields/FieldValueCard";

interface PersonCustomFieldsProps {
  personId: string;
}

export function PersonCustomFields({ personId }: PersonCustomFieldsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { isLoading, fieldValues } = useFields("person", personId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Campos Personalizados</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Campos Personalizados</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {fieldValues.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum campo personalizado encontrado.
        </p>
      ) : (
        <div className="space-y-4">
          {fieldValues.map((fieldValue) => (
            <FieldValueCard
              key={fieldValue.id}
              fieldValue={fieldValue}
              targetId={personId}
            />
          ))}
        </div>
      )}

      <AddFieldDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        targetId={personId}
        targetType="person"
      />
    </div>
  );
} 
