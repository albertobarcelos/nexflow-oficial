import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  GripVertical, 
  Package,
  ChevronDown,
  Settings,
  Trash
} from 'lucide-react';
import { FieldType, FIELD_TYPES } from './FieldTypesSidebar';
import { FieldConfiguration } from '@/types/form-builder';

interface FormPreviewProps {
  title: string;
  onTitleChange: (title: string) => void;
  fields: FieldConfiguration[];
  onFieldAdd: (fieldType: FieldType, position?: number) => void;
  onFieldEdit: (field: FieldConfiguration) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldReorder: (fields: FieldConfiguration[]) => void;
  isLoading?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showPhaseSelector?: boolean;
}

export function FormPreview({
  title,
  onTitleChange,
  fields,
  onFieldAdd,
  onFieldEdit,
  onFieldDelete,
  onFieldReorder,
  isLoading = false,
  emptyStateTitle = "Comece a criar seu formulário de fase",
  emptyStateDescription = "arrastando e soltando campos nesse espaço",
  showPhaseSelector = false
}: FormPreviewProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    if (typeof index === 'number') {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, position?: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    try {
      const fieldTypeData = e.dataTransfer.getData('application/json');
      const fieldType: FieldType = JSON.parse(fieldTypeData);
      
      // Apenas adicionar o campo - o FormBuilderModal gerencia a abertura automática
      onFieldAdd(fieldType, position);
    } catch (error) {
      console.error('Error parsing dropped field:', error);
    }
  };

  const getFieldIcon = (fieldType: string) => {
    const fieldTypeData = FIELD_TYPES.find(ft => ft.id === fieldType);
    return fieldTypeData?.icon;
  };

  const getFieldColor = (fieldType: string) => {
    const fieldTypeData = FIELD_TYPES.find(ft => ft.id === fieldType);
    return fieldTypeData?.color || 'text-gray-600';
  };

  const renderField = (field: FieldConfiguration, index: number) => {
    const Icon = getFieldIcon(field.type);
    const colorClass = getFieldColor(field.type);
    const fieldTypeLabel = FIELD_TYPES.find(ft => ft.id === field.type)?.label || field.type;

    return (
      <div key={field.id} className="relative">
        {/* Drop zone before field */}
        <div
          className={`h-2 transition-all duration-200 ${
            dragOverIndex === index 
              ? 'bg-blue-200 border-2 border-dashed border-blue-400 rounded' 
              : 'hover:bg-blue-50'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
        />

        {/* Campo estilo Pipefy */}
        <div 
          className="group bg-white border border-gray-200 rounded-lg mb-3 hover:shadow-sm transition-all cursor-pointer"
          onClick={() => onFieldEdit(field)}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="cursor-grab hover:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>

              {Icon && (
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-800">{field.label}</span>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      Obrigatório
                    </Badge>
                  )}
                  {field.uniqueValue && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      Único
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {fieldTypeLabel}
                  {field.placeholder && ` • ${field.placeholder}`}
                </div>
                {field.description && (
                  <div className="text-xs text-gray-400 mt-1">
                    {field.description}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldEdit(field);
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldDelete(field.id);
                }}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header simplificado para Formulário inicial */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {showPhaseSelector ? (
              <span className="text-sm text-gray-500">Fase atual</span>
            ) : (
              <h2 className="text-lg font-semibold text-gray-800">
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-sm">
              Condicionais em campos
            </Button>
            <Button variant="outline" size="sm" className="text-sm">
              Opções Avançadas
            </Button>
          </div>
        </div>

        {/* Seletor de fase apenas se showPhaseSelector for true */}
        {showPhaseSelector && (
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">{title}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Área de campos */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div
          className="min-h-[400px] space-y-2"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, fields.length)}
        >
          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {emptyStateTitle}
              </h3>
              <p className="text-gray-500 text-sm">
                {emptyStateDescription}
              </p>
            </div>
          ) : (
            <>
              {fields.map((field, index) => renderField(field, index))}
              
              {/* Drop zone final */}
              <div
                className={`h-8 transition-all duration-200 ${
                  dragOverIndex === fields.length 
                    ? 'bg-blue-200 border-2 border-dashed border-blue-400 rounded' 
                    : 'hover:bg-blue-50'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, fields.length)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, fields.length)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Manter compatibilidade com interface antiga
export interface FormField extends FieldConfiguration {} 