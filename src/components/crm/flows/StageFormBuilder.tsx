import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Layers, ChevronRight } from 'lucide-react';
import { FieldTypesSidebar, FieldType } from './FieldTypesSidebar';
import { FormPreview, FormField } from './FormPreview';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  fields: FormField[];
}

interface StageFormBuilderProps {
  flowId: string;
  flowName: string;
}

export function StageFormBuilder({ flowId, flowName }: StageFormBuilderProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>('stage_1');
  const [stages, setStages] = useState<Stage[]>([
    {
      id: 'stage_1',
      name: 'Caixa de entrada',
      color: '#10b981',
      order: 1,
      fields: []
    },
    {
      id: 'stage_2',
      name: 'Fazendo',
      color: '#f59e0b',
      order: 2,
      fields: []
    },
    {
      id: 'stage_3',
      name: 'Concluído',
      color: '#ef4444',
      order: 3,
      fields: []
    }
  ]);

  const selectedStage = stages.find(s => s.id === selectedStageId);

  const handleStageSelect = (stageId: string) => {
    setSelectedStageId(stageId);
  };

  const handleStageNameChange = (newName: string) => {
    setStages(stages.map(stage => 
      stage.id === selectedStageId 
        ? { ...stage, name: newName }
        : stage
    ));
  };

  const handleFieldAdd = (fieldType: FieldType, position?: number) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType.id,
      label: fieldType.label,
      placeholder: `Digite ${fieldType.label.toLowerCase()}`,
      required: false,
      order: position !== undefined ? position : (selectedStage?.fields.length || 0)
    };

    setStages(stages.map(stage => {
      if (stage.id === selectedStageId) {
        const currentFields = stage.fields;
        if (position !== undefined) {
          // Insert at specific position
          const newFields = [...currentFields];
          newFields.splice(position, 0, newField);
          // Reorder all fields
          const reorderedFields = newFields.map((field, index) => ({
            ...field,
            order: index
          }));
          return { ...stage, fields: reorderedFields };
        } else {
          // Add at the end
          return { ...stage, fields: [...currentFields, newField] };
        }
      }
      return stage;
    }));
  };

  const handleFieldEdit = (field: FormField) => {
    // TODO: Open field editor modal
    console.log('Edit field:', field);
  };

  const handleFieldDelete = (fieldId: string) => {
    setStages(stages.map(stage => 
      stage.id === selectedStageId 
        ? { ...stage, fields: stage.fields.filter(f => f.id !== fieldId) }
        : stage
    ));
  };

  const handleFieldReorder = (reorderedFields: FormField[]) => {
    setStages(stages.map(stage => 
      stage.id === selectedStageId 
        ? { ...stage, fields: reorderedFields }
        : stage
    ));
  };

  const addNewStage = () => {
    const newStage: Stage = {
      id: `stage_${Date.now()}`,
      name: 'Nova Fase',
      color: '#6366f1',
      order: stages.length + 1,
      fields: []
    };
    setStages([...stages, newStage]);
    setSelectedStageId(newStage.id);
  };

  return (
    <div className="flex h-full">
      {/* Stages Sidebar */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Fases do Pipeline</h3>
            <Button onClick={addNewStage} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Fase
            </Button>
          </div>

          <div className="space-y-2">
            {stages.map((stage) => (
              <Card 
                key={stage.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedStageId === stage.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-transparent hover:border-slate-300'
                }`}
                onClick={() => handleStageSelect(stage.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-700 truncate">
                        {stage.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {stage.fields.length} campo{stage.fields.length !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Ordem {stage.order}
                        </span>
                      </div>
                    </div>
                    {selectedStageId === stage.id && (
                      <ChevronRight className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Layers className="w-4 h-4" />
              <span>{stages.length} fase{stages.length !== 1 ? 's' : ''} configurada{stages.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Field Types Sidebar */}
      <FieldTypesSidebar selectedStage={selectedStageId} />

      {/* Form Preview */}
      {selectedStage ? (
        <FormPreview
          title={selectedStage.name}
          onTitleChange={handleStageNameChange}
          fields={selectedStage.fields}
          onFieldAdd={handleFieldAdd}
          onFieldEdit={handleFieldEdit}
          onFieldDelete={handleFieldDelete}
          onFieldReorder={handleFieldReorder}
          emptyStateTitle="Comece a criar seu formulário de fase"
          emptyStateDescription="arrastando e soltando campos nesse espaço"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Selecione uma fase
            </h3>
            <p className="text-slate-500">
              Escolha uma fase para configurar seus campos
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 