import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FormInput, 
  Database,
  Save, 
  Eye, 
  X, 
  Loader2,
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Componentes internos
import { FieldTypesSidebar } from '../flows/FieldTypesSidebar';
import { FormPreview } from '../flows/FormPreview';
import { FieldConfigurationModal } from '../flows/FieldConfigurationModal';

// Types adaptados para a estrutura do banco
export interface EntityFieldConfiguration {
  id: string;
  entity_id: string;
  name: string;
  slug: string;
  field_type: string;
  description?: string;
  is_required: boolean;
  is_unique: boolean;
  options: any[];
  validation_rules: any;
  default_value: any;
  order_index: number;
  layout_config: any;
  is_system: boolean;
  is_active: boolean;
  
  // Campos extras para compatibilidade com FormPreview
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  uniqueValue: boolean;
  searchable: boolean;
}

export interface FieldType {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: 'basic' | 'advanced' | 'data';
  allowOptions?: boolean;
  allowMask?: boolean;
}

interface EntityFormBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
}

export function EntityFormBuilderModal({ open, onOpenChange, entityId, entityName }: EntityFormBuilderModalProps) {
  const [formTitle, setFormTitle] = useState(entityName);
  const [selectedField, setSelectedField] = useState<EntityFieldConfiguration | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [pendingField, setPendingField] = useState<EntityFieldConfiguration | null>(null);
  const [localFields, setLocalFields] = useState<EntityFieldConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar campos existentes da entidade
  useEffect(() => {
    if (open && entityId) {
      loadEntityFields();
    }
  }, [open, entityId]);

  const loadEntityFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('web_entity_fields')
        .select('*')
        .eq('entity_id', entityId)
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Erro ao carregar campos da entidade:', error);
        toast.error('Erro ao carregar campos da entidade');
        return;
      }

      // Transformar dados para compatibilidade com FormPreview
      const transformedFields = (data || []).map((field: any) => ({
        ...field,
        type: field.field_type,
        label: field.name,
        placeholder: `Digite ${field.name.toLowerCase()}`,
        required: field.is_required,
        order: field.order_index,
        uniqueValue: field.is_unique,
        searchable: true
      }));
      
      setLocalFields(transformedFields);
    } catch (error) {
      console.error('Erro ao carregar campos da entidade:', error);
      toast.error('Erro ao carregar campos da entidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldAdd = useCallback((fieldType: FieldType, position?: number) => {
    const newOrder = position !== undefined ? position : localFields.length;
    const newField: EntityFieldConfiguration = {
      id: `field_${Date.now()}`,
      entity_id: entityId,
      name: fieldType.label,
      slug: fieldType.label.toLowerCase().replace(/\s+/g, '_'),
      field_type: fieldType.id,
      description: '',
      is_required: false,
      is_unique: false,
      options: [],
      validation_rules: {},
      default_value: null,
      order_index: newOrder,
      layout_config: { width: 'full', column: 1 },
      is_system: false,
      is_active: true,
      
      // Campos para compatibilidade
      type: fieldType.id,
      label: fieldType.label,
      placeholder: `Digite ${fieldType.label.toLowerCase()}`,
      required: false,
      order: newOrder,
      uniqueValue: false,
      searchable: true
    };

    if (position !== undefined) {
      const newFields = [...localFields];
      newFields.splice(position, 0, newField);
      const reorderedFields = newFields.map((field, index) => ({
        ...field,
        order_index: index,
        order: index
      }));
      setLocalFields(reorderedFields);
    } else {
      setLocalFields([...localFields, newField]);
    }

    // Abrir modal de configuração para o novo campo
    setPendingField(newField);
    setConfigModalOpen(true);
  }, [localFields, entityId]);

  const handleFieldUpdate = useCallback((updatedField: EntityFieldConfiguration) => {
    setLocalFields(prev => 
      prev.map(field => 
        field.id === updatedField.id ? updatedField : field
      )
    );
  }, []);

  const handleFieldDelete = useCallback((fieldId: string) => {
    setLocalFields(prev => prev.filter(field => field.id !== fieldId));
  }, []);

  const handleFieldReorder = useCallback((draggedId: string, targetId: string, position: 'before' | 'after') => {
    const draggedIndex = localFields.findIndex(f => f.id === draggedId);
    const targetIndex = localFields.findIndex(f => f.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newFields = [...localFields];
    const draggedField = newFields.splice(draggedIndex, 1)[0];
    
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
    newFields.splice(insertIndex, 0, draggedField);
    
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      order_index: index,
      order: index
    }));
    
    setLocalFields(reorderedFields);
  }, [localFields]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar salvamento real no banco de dados
      console.log('Salvando campos da entidade:', {
        entityId,
        fields: localFields
      });
      
      toast.success('Campos da entidade salvos com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar campos da entidade:', error);
      toast.error('Erro ao salvar campos da entidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigModalClose = () => {
    setConfigModalOpen(false);
    setPendingField(null);
    setSelectedField(null);
  };

  const handleFieldConfigSave = (field: EntityFieldConfiguration) => {
    if (pendingField) {
      // Novo campo
      handleFieldUpdate(field);
      setPendingField(null);
    } else if (selectedField) {
      // Campo existente
      handleFieldUpdate(field);
      setSelectedField(null);
    }
    setConfigModalOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="flex h-full">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-semibold">
                      Configurar Campos - {entityName}
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                      Configure os campos específicos desta entidade
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex w-full h-full pt-20">
              {/* Sidebar - Tipos de Campo */}
              <div className="w-80 border-r border-slate-200 bg-slate-50">
                <FieldTypesSidebar onFieldAdd={handleFieldAdd} />
              </div>

              {/* Main Content - Preview do Formulário */}
              <div className="flex-1 bg-white overflow-hidden">
                <div className="h-full p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FormInput className="w-5 h-5 text-slate-600" />
                      <h3 className="text-base font-medium">Campos da Entidade</h3>
                      <Badge variant="secondary" className="text-xs">
                        {localFields.length} campos
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Estes campos aparecerão quando esta entidade for vinculada a um deal
                    </p>
                  </div>

                  <FormPreview
                    fields={localFields}
                    onFieldEdit={(field) => {
                      setSelectedField(field);
                      setConfigModalOpen(true);
                    }}
                    onFieldDelete={handleFieldDelete}
                    onFieldReorder={handleFieldReorder}
                    onFieldAdd={handleFieldAdd}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração de Campo */}
      <FieldConfigurationModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        field={pendingField || selectedField}
        onSave={handleFieldConfigSave}
        onClose={handleConfigModalClose}
      />
    </>
  );
} 