import { Entity } from "../types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EntityListProps {
  entities: Entity[];
  selectedEntityId?: string | null;
  onSelectEntity?: (id: string) => void;
}

export function EntityList({ 
  entities, 
  selectedEntityId, 
  onSelectEntity,
}: EntityListProps) {
  return (
    <div className="space-y-2 h-full">
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
        <Card className="p-4">
          <p className="text-muted-foreground text-center">
            Nenhuma entidade encontrada
          </p>
        </Card>
      )}
    </div>
  );
}