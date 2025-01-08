import { Card } from "@/components/ui/card";
import { EntityList } from "../../entities/components/EntityList";
import { Entity } from "../../entities/types";

interface EntitySelectorProps {
  entities: Entity[] | undefined;
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
}

export function EntitySelector({ entities, selectedEntityId, onSelectEntity }: EntitySelectorProps) {
  return (
    <Card className="p-4 overflow-auto border-primary/10">
      <EntityList
        entities={entities || []}
        selectedEntityId={selectedEntityId}
        onSelectEntity={onSelectEntity}
      />
    </Card>
  );
}