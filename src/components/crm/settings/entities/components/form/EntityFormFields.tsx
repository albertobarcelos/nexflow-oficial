import { EntityFieldEditor } from "../EntityFieldEditor";
import { ConfiguredFieldsTable } from "../ConfiguredFieldsTable";
import { Entity } from "../../types";

interface EntityFormFieldsProps {
  fields: any[];
  setFields: (fields: any[]) => void;
  currentEntityId: string;
  entities: Entity[];
}

export function EntityFormFields({ fields, setFields, currentEntityId, entities }: EntityFormFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campos da Entidade</h3>
      <EntityFieldEditor 
        fields={fields} 
        onChange={setFields} 
        currentEntityId={currentEntityId}
        entities={entities || []}
      />
      
      {fields.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Campos Configurados</h4>
          <ConfiguredFieldsTable fields={fields} />
        </div>
      )}
    </div>
  );
}