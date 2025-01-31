import { useState } from "react";
import { useFields } from "@/hooks/useFields";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddFieldDialog } from "./AddFieldDialog";
import { FieldValueCard } from "./FieldValueCard";

interface CompanyCustomFieldsProps {
  companyId: string;
}

export function CompanyCustomFields({ companyId }: CompanyCustomFieldsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { isLoading, fieldValues } = useFields("company", companyId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Campos personalizados</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {!fieldValues?.length ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum campo personalizado encontrado
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fieldValues.map((fieldValue) => (
            <FieldValueCard
              key={fieldValue.id}
              fieldValue={fieldValue}
              targetId={companyId}
            />
          ))}
        </div>
      )}

      <AddFieldDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        targetId={companyId}
        targetType="company"
      />
    </div>
  );
} 
