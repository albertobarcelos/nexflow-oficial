import React, { useState } from 'react';
import { FieldTypesSidebar, FieldType } from './FieldTypesSidebar';
import { FormPreview, FormField } from './FormPreview';

interface InitialFormBuilderProps {
  flowId: string;
  flowName: string;
}

export function InitialFormBuilder({ flowId, flowName }: InitialFormBuilderProps) {
  const [formTitle, setFormTitle] = useState(flowName);
  const [fields, setFields] = useState<FormField[]>([
    {
      id: '1',
      type: 'text',
      label: 'Título',
      placeholder: 'Digite o título do item',
      required: true,
      order: 1
    }
  ]);

  const handleFieldAdd = (fieldType: FieldType, position?: number) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType.id,
      label: fieldType.label,
      placeholder: `Digite ${fieldType.label.toLowerCase()}`,
      required: false,
      order: position !== undefined ? position : fields.length
    };

    if (position !== undefined) {
      // Insert at specific position
      const newFields = [...fields];
      newFields.splice(position, 0, newField);
      // Reorder all fields
      const reorderedFields = newFields.map((field, index) => ({
        ...field,
        order: index
      }));
      setFields(reorderedFields);
    } else {
      // Add at the end
      setFields([...fields, newField]);
    }
  };

  const handleFieldEdit = (field: FormField) => {
    // TODO: Open field editor modal
    console.log('Edit field:', field);
  };

  const handleFieldDelete = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleFieldReorder = (reorderedFields: FormField[]) => {
    setFields(reorderedFields);
  };

  return (
    <div className="flex h-full">
      <FieldTypesSidebar />
      <FormPreview
        title={formTitle}
        onTitleChange={setFormTitle}
        fields={fields}
        onFieldAdd={handleFieldAdd}
        onFieldEdit={handleFieldEdit}
        onFieldDelete={handleFieldDelete}
        onFieldReorder={handleFieldReorder}
        emptyStateTitle="Comece a criar seu formulário inicial"
        emptyStateDescription="arrastando e soltando campos nesse espaço"
      />
    </div>
  );
} 