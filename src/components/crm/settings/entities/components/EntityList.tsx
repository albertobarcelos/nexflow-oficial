import { Entity } from "../types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CreateEntityDialog } from "./CreateEntityDialog";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EntityListProps {
  entities: Entity[];
  selectedEntityId?: string | null;
  onSelectEntity?: (id: string) => void;
  onEdit?: (entity: Entity) => void;
}

export function EntityList({ 
  entities, 
  selectedEntityId, 
  onSelectEntity,
  onEdit 
}: EntityListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Entidades</h2>
        <CreateEntityDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>

      <div className="space-y-2">
        {entities.map((entity) => (
          <Card
            key={entity.id}
            className={cn(
              "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
              selectedEntityId === entity.id && "bg-muted"
            )}
            onClick={() => onSelectEntity?.(entity.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{entity.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {entity.entity_fields?.length || 0} campos
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(entity.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </Card>
        ))}

        {entities.length === 0 && (
          <Card className="p-4 flex flex-col items-center justify-center space-y-2 text-center">
            <p className="text-muted-foreground">Nenhuma entidade configurada</p>
            <CreateEntityDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Entidade
              </Button>
            </CreateEntityDialog>
          </Card>
        )}
      </div>
    </div>
  );
}