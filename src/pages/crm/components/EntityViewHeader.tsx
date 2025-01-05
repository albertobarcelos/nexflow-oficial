import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EntityRecordForm } from "@/components/crm/entities/EntityRecordForm";

interface EntityViewHeaderProps {
  entityName: string;
  entityId: string;
  fields: any[];
}

export function EntityViewHeader({ entityName, entityId, fields }: EntityViewHeaderProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{entityName}</h1>
        <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar {entityName}
        </Button>
      </div>

      <EntityRecordForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        entityId={entityId}
        entityName={entityName}
        fields={fields}
      />
    </>
  );
}