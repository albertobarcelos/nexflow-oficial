import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EntityField, Entity } from "../../types";
import { EntityFieldList } from "./EntityFieldList";

interface EntityFieldEditorProps {
  fields: EntityField[];
  entities: Entity[];
  currentEntityId: string;
  onChange: (fields: EntityField[]) => void;
}

export function EntityFieldEditor({
  fields,
  entities,
  currentEntityId,
  onChange
}: EntityFieldEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Campos da Entidade</h3>
        <p className="text-sm text-muted-foreground">
          Arraste e solte os campos para reorganizá-los. Você também pode duplicar ou remover campos conforme necessário.
        </p>
      </div>

      <Separator />

      <ScrollArea className="h-[400px] pr-4">
        <EntityFieldList
          fields={fields}
          entities={entities}
          currentEntityId={currentEntityId}
          onChange={onChange}
        />
      </ScrollArea>
    </div>
  );
}