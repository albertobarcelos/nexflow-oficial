import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
// import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  ChevronDown, 
  ChevronRight,
  Columns,
  Layout,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Link,
  Hash,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Circle,
  Upload,
  Settings,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Palette,
  AlertCircle
} from 'lucide-react';
import { useFlowOverviewLayout, useLayoutConfiguration } from '@/hooks/useFlowOverviewLayouts';
import { FlowOverviewField, FlowOverviewSection, FIELD_TYPES, FieldType } from '@/types/flow-layouts';
import { useToast } from '@/components/ui/use-toast';

interface OverviewLayoutConfigurationProps {
  flowId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface FieldFormData {
  label: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  placeholder: string;
  options: string[];
  width: 'full' | 'half';
  validation: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export function OverviewLayoutConfiguration({ flowId, onSave, onCancel }: OverviewLayoutConfigurationProps) {
  const { layout, isLoading, updateLayout, isUpdating } = useFlowOverviewLayout(flowId);
  const { state, actions } = useLayoutConfiguration(layout);
  const { toast } = useToast();
  
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<{ sectionId: string; fieldId?: string } | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [newSectionName, setNewSectionName] = useState('');
  
  const [fieldFormData, setFieldFormData] = useState<FieldFormData>({
    label: '',
    type: 'text',
    required: false,
    unique: false,
    placeholder: '',
    options: [],
    width: 'full',
    validation: {}
  });

  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    column: 1 as 1 | 2,
    collapsed: false
  });

  // Salvar configurações
  const handleSave = () => {
    if (state.layout.id) {
      updateLayout({
        ...state.layout,
        updated_at: new Date().toISOString(),
      });
    }
    onSave?.();
  };

  // Resetar configurações
  const handleReset = () => {
    actions.resetLayout();
  };

  // Drag and drop de seções
  const handleSectionDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedSections = Array.from(state.layout.sections);
    const [movedSection] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, movedSection);
    
    actions.reorderSections(reorderedSections);
  };

  // Drag and drop de campos dentro de uma seção
  const handleFieldDragEnd = (result: DropResult, sectionId: string) => {
    if (!result.destination) return;
    
    const section = state.layout.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const reorderedFields = Array.from(section.fields);
    const [movedField] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedField);
    
    actions.updateSection(sectionId, { fields: reorderedFields });
  };

  // Adicionar nova seção
  const handleAddSection = () => {
    if (newSectionName.trim()) {
      actions.addSection({
        title: newSectionName.trim(),
        column: 1, // Sempre coluna 1
        collapsed: false,
        fields: [],
      });
      setNewSectionName('');
    }
  };

  // Editar seção
  const handleEditSection = (sectionId: string) => {
    const section = state.layout.sections.find(s => s.id === sectionId);
    if (section) {
      setSectionFormData({
        title: section.title,
        column: section.column,
        collapsed: section.collapsed
      });
      setEditingSection(sectionId);
      setShowSectionModal(true);
    }
  };

  // Salvar seção
  const handleSaveSection = () => {
    if (editingSection) {
      actions.updateSection(editingSection, sectionFormData);
    } else {
      actions.addSection({
        title: sectionFormData.title,
        column: sectionFormData.column,
        collapsed: sectionFormData.collapsed,
        fields: []
      });
    }
    setShowSectionModal(false);
  };

  // Adicionar campo a seção
  const handleAddField = (sectionId: string) => {
    // Por enquanto, vamos adicionar um campo de exemplo
    actions.addFieldToSection(sectionId, {
      label: 'Novo Campo',
      type: 'text',
      required: false,
      unique: false,
      placeholder: 'Digite aqui...',
      width: 'full',
      order: state.layout.sections.find(s => s.id === sectionId)?.fields?.length || 0,
      validation: {},
    });
  };

  // Editar campo
  const handleEditField = (sectionId: string, fieldId: string) => {
    const section = state.layout.sections.find(s => s.id === sectionId);
    const field = section?.fields.find(f => f.id === fieldId);
    
    if (field) {
      setFieldFormData({
        label: field.label,
        type: field.type,
        required: field.required,
        unique: field.unique || false,
        placeholder: field.placeholder || '',
        options: field.options || [],
        width: field.width || 'full',
        validation: field.validation || {}
      });
      setEditingField({ sectionId, fieldId });
      setShowFieldModal(true);
    }
  };

  // Salvar campo
  const handleSaveField = () => {
    if (!editingField) return;
    
    const fieldData: Omit<FlowOverviewField, 'id'> = {
      label: fieldFormData.label,
      type: fieldFormData.type,
      required: fieldFormData.required,
      unique: fieldFormData.unique,
      placeholder: fieldFormData.placeholder,
      options: fieldFormData.options,
      width: fieldFormData.width,
      validation: fieldFormData.validation
    };

    if (editingField.fieldId) {
      actions.updateField(editingField.sectionId, editingField.fieldId, fieldData);
    } else {
      actions.addFieldToSection(editingField.sectionId, fieldData);
    }
    
    setShowFieldModal(false);
  };

  // Renderizar ícone do tipo de campo
  const renderFieldIcon = (type: FieldType) => {
    const IconComponent = FIELD_TYPES[type]?.icon;
    if (!IconComponent) return <Type className="w-4 h-4" />;
    
    // Mapear nomes de ícones para componentes
    const iconMap: Record<string, React.ComponentType<any>> = {
      Type, AlignLeft, Mail, Phone, Link, Hash, DollarSign, Percent,
      Calendar, Clock, CheckSquare, Square, Circle, Upload
    };
    
    const Icon = iconMap[IconComponent] || Type;
    return <Icon className="w-4 h-4" />;
  };

  // Renderizar campos de uma seção
  const renderSectionFields = (section: FlowOverviewSection) => {
    if (!section.fields || section.fields.length === 0) {
      return (
        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm">Nenhum campo adicionado</p>
          <p className="text-xs">Clique em "Adicionar Campo" para começar</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {section.fields
          .sort((a, b) => a.order - b.order)
          .map((field, index) => (
            <div key={field.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700">{field.label}</span>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">
                      Obrigatório
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge variant="outline" className="text-xs">
                    {FIELD_TYPES[field.type]?.label || field.type}
                  </Badge>
                  <span>•</span>
                  <span>{field.width === 'half' ? 'Meia largura' : 'Largura total'}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.removeFieldFromSection(section.id, field.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
      </div>
    );
  };

  // Renderizar seção
  const renderSection = (section: FlowOverviewSection, index: number) => {
    const isCollapsed = collapsedSections.has(section.id);
    const isEditing = editingSection === section.id;

    return (
      <Draggable key={section.id} draggableId={section.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`border-slate-200/60 shadow-sm ${snapshot.isDragging ? 'shadow-lg' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div {...provided.dragHandleProps} className="cursor-grab hover:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) => actions.updateSection(section.id, { title: e.target.value })}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSection(null)}
                        className="h-8 px-2"
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCollapsedSections(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(section.id)) {
                            newSet.delete(section.id);
                          } else {
                            newSet.add(section.id);
                          }
                          return newSet;
                        })}
                        className="flex items-center gap-1 hover:text-slate-700"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </button>
                      <Badge variant="outline" className="text-xs">
                        {section.fields?.length || 0} campo{(section.fields?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSection(section.id)}
                    className="h-8 px-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => actions.removeSection(section.id)}
                    className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isCollapsed && (
              <CardContent className="space-y-4">
                {renderSectionFields(section)}
                
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField(section.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Campo
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </Draggable>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Configurar Layout da Visão Geral</h3>
          <p className="text-sm text-slate-600">
            Organize os campos e seções que aparecerão na aba "Visão Geral" dos negócios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? 'Editar' : 'Visualizar'}
          </Button>
          {state.isDirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
          )}
        </div>
      </div>

      {/* Adicionar Nova Seção */}
      {!previewMode && (
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova seção..."
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSection();
                  }
                }}
              />
              <Button
                onClick={handleAddSection}
                disabled={!newSectionName.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Seção
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seções em Coluna Única */}
      <div className="space-y-4">
        {state.layout.sections.length === 0 ? (
          <Card className="border-slate-200/60 shadow-sm">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="font-semibold text-slate-700 mb-2">Nenhuma seção configurada</h3>
              <p className="text-sm text-slate-500 mb-4">
                Adicione seções para organizar os campos da visão geral
              </p>
            </CardContent>
          </Card>
        ) : (
          <DragDropContext
            onDragEnd={(result) => {
              if (!result.destination) return;

              const sections = Array.from(state.layout.sections);
              const [reorderedSection] = sections.splice(result.source.index, 1);
              sections.splice(result.destination.index, 0, reorderedSection);

              actions.reorderSections(sections);
            }}
          >
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {state.layout.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => renderSection(section, index))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Footer com botões de ação */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          {state.isDirty && (
            <Badge variant="secondary" className="text-xs">
              Alterações não salvas
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!state.isDirty || isUpdating}
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 