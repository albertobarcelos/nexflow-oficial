import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EntityViewHeaderProps {
  entityName: string;
  onCreateRecord: () => void;
}

export function EntityViewHeader({ entityName, onCreateRecord }: EntityViewHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold">{entityName}</h1>
      <Button onClick={onCreateRecord} className="bg-primary hover:bg-primary/90">
        <Plus className="mr-2 h-4 w-4" />
        Adicionar {entityName}
      </Button>
    </div>
  );
}