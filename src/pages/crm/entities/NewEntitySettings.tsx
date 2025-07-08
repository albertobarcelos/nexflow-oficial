import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { useEntityBuilder, FieldBuilder } from '@/contexts/EntityBuilderContext';
import { useEntities } from '@/hooks/useEntities';
import { Database, Plus, Trash2, GripVertical, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente para item sortable usando @dnd-kit
function SortableFieldItem({ 
  field, 
  index, 
  openEditFieldModal, 
  setConfirmFieldIdx 
}: {
  field: FieldBuilder;
  index: number;
  openEditFieldModal: (index: number) => void;
  setConfirmFieldIdx: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `field-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldTypeLabels = {
    short_text: "Texto Curto",
    long_text: "Texto Longo",
    email: "Email",
    phone: "Telefone",
    url: "URL",
    number: "Número",
    currency: "Moeda",
    date: "Data",
    datetime: "Data e Hora",
    checkbox: "Checkbox",
    single_select: "Seleção Única",
    multi_select: "Seleção Múltipla"
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded-lg bg-white transition-shadow ${
        isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{field.name}</span>
              {field.is_required && (
                <Badge variant="destructive" className="text-xs">
                  Obrigatório
                </Badge>
              )}
              {field.is_unique && (
                <Badge variant="secondary" className="text-xs">
                  Único
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{fieldTypeLabels[field.field_type as keyof typeof fieldTypeLabels]}</span>
              {field.description && (
                <>
                  <span>•</span>
                  <span className="truncate">{field.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditFieldModal(index)}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmFieldIdx(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const NewEntitySettings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    name: entityName, 
    slug,
    description,
    icon,
    setIcon,
    color,
    setColor,
    fields, 
    setFields,
    addField, 
    updateField, 
    removeField, 
    resetEntity 
  } = useEntityBuilder();

  const { createEntity } = useEntities();

  // Redireciona se a página for acessada sem um nome de entidade
  useEffect(() => {
    console.log('🔍 Verificando nome da entidade:', entityName);
    // Comentado temporariamente para debug
    // if (!entityName) {
    //   navigate("/crm");
    // }
  }, [entityName, navigate]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fieldDraft, setFieldDraft] = useState<FieldBuilder | undefined>(undefined);
  const [confirmFieldIdx, setConfirmFieldIdx] = useState<number | null>(null);

  // Sensores para @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const openNewFieldModal = () => {
    setFieldDraft({
      name: "",
      slug: "",
      field_type: "short_text",
      description: "",
      is_required: false,
      is_unique: false,
      options: [],
      validation_rules: {},
      default_value: null,
      layout_config: { width: "full", column: 1 }
    });
    setEditingIndex(null);
    setModalOpen(true);
  };

  const openEditFieldModal = (idx: number) => {
    setFieldDraft(fields[idx]);
    setEditingIndex(idx);
    setModalOpen(true);
  };

  const handleSaveField = (field: FieldBuilder) => {
    if (editingIndex !== null) {
      updateField(editingIndex, field);
    } else {
      addField(field);
    }
  };

  const handleDeleteField = (idx: number) => {
    removeField(idx);
    setConfirmFieldIdx(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((_, index) => `field-${index}` === active.id);
      const newIndex = fields.findIndex((_, index) => `field-${index}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(fields, oldIndex, newIndex);
        setFields(reordered);
      }
    }
  };

  const handleSaveEntity = async () => {
    try {
      console.log('🚀 Iniciando criação da entidade...');
      console.log('📝 Dados da entidade:', { entityName, slug, description, icon, color });
      console.log('🔧 Campos:', fields);

      if (!entityName.trim()) {
        console.error('❌ Nome da entidade está vazio');
        toast({
          title: "Erro",
          description: "Nome da entidade é obrigatório",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Validação passou, criando entidade...');

      // 1. Criar a entidade
      const entity = await createEntity({
        name: capitalize(entityName),
        slug: slug,
        description: description || null,
        icon: icon,
        color: color
      });

      console.log('✅ Entidade criada:', entity);

      // 2. Criar os campos personalizados usando o Supabase client diretamente
      if (fields.length > 0) {
        console.log('🔧 Criando campos...');
        const { supabase } = await import('@/lib/supabase');
        
        const fieldsToInsert = fields.map((field, index) => ({
          entity_id: entity.id,
          name: field.name,
          slug: field.slug,
          field_type: field.field_type,
          description: field.description || null,
          is_required: field.is_required,
          is_unique: field.is_unique,
          options: field.options,
          validation_rules: field.validation_rules,
          default_value: field.default_value,
          order_index: index + 1,
          layout_config: field.layout_config,
          is_system: false,
          is_active: true
        }));

        console.log('📋 Campos para inserir:', fieldsToInsert);

        const { error: fieldsError } = await supabase
          .from('web_entity_fields')
          .insert(fieldsToInsert);

        if (fieldsError) {
          console.error('❌ Erro ao criar campos:', fieldsError);
          throw new Error(`Erro ao criar campos: ${fieldsError.message}`);
        }

        console.log('✅ Campos criados com sucesso');
      }

      console.log('🎉 Sucesso! Navegando para a entidade...');
      toast({
        title: "Sucesso!",
        description: "Base de dados criada com sucesso!"
      });
      resetEntity();
      navigate(`/crm/entity/${entity.id}`);
    } catch (err: any) {
      console.error('💥 Erro completo:', err);
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Erro",
        description: message || "Erro ao salvar entidade",
        variant: "destructive"
      });
    }
  };

  const fieldTypeLabels = {
    short_text: "Texto Curto",
    long_text: "Texto Longo",
    email: "Email",
    phone: "Telefone",
    url: "URL",
    number: "Número",
    currency: "Moeda",
    date: "Data",
    datetime: "Data e Hora",
    checkbox: "Checkbox",
    single_select: "Seleção Única",
    multi_select: "Seleção Múltipla",
    user_select: "Usuário",
    entity_reference: "Referência",
    file_upload: "Arquivo",
    rich_text: "Texto Rico"
  };

  return (
    <div className="p-8 mx-auto bg-[#f0f3fd] min-h-screen">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-neutral-700" />
          <span className="text-[20px] font-semibold text-neutral-900">Nova Base de Dados</span>
        </div>
        <Button
          className="bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-600 hover:border-orange-500 transition-colors"
          size="sm"
          onClick={handleSaveEntity}
        >
          Salvar
        </Button>
      </div>
      
      <div className="mt-1 text-[22px] ml-6 font-semibold text-orange-500 italic">
        {capitalize(entityName)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Configurações Gerais - 1/3 */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Configurações</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="entity-name">Nome da Base</Label>
                <Input
                  id="entity-name"
                  value={entityName}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="entity-slug">Slug (Identificador)</Label>
                <Input
                  id="entity-slug"
                  value={slug}
                  disabled
                  className="bg-gray-50 font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="entity-description">Descrição</Label>
                <Textarea
                  id="entity-description"
                  value={description}
                  onChange={(e) => setDescription && setDescription(e.target.value)}
                  placeholder="Descreva o propósito desta base..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="entity-color">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="entity-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campos - 2/3 */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Campos</h2>
              <Button
                onClick={openNewFieldModal}
                size="sm"
                className="bg-blue-900 rounded-full text-white hover:bg-orange-500 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo Campo
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                Nenhum campo adicionado ainda.
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={fields.map((_, index) => `field-${index}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <SortableFieldItem
                        key={`field-${index}`}
                        field={field}
                        index={index}
                        openEditFieldModal={openEditFieldModal}
                        setConfirmFieldIdx={setConfirmFieldIdx}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Campo */}
      <FieldModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        field={fieldDraft}
        onSave={handleSaveField}
        isEditing={editingIndex !== null}
      />

      {/* Modal de Confirmação */}
      <Dialog open={confirmFieldIdx !== null} onOpenChange={open => !open && setConfirmFieldIdx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover campo?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            Tem certeza que deseja remover este campo da base de dados?
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmFieldIdx(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmFieldIdx !== null && handleDeleteField(confirmFieldIdx)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente do Modal de Campo
interface FieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: FieldBuilder;
  onSave: (field: FieldBuilder) => void;
  isEditing: boolean;
}

const FieldModal: React.FC<FieldModalProps> = ({ 
  open, 
  onOpenChange, 
  field, 
  onSave, 
  isEditing 
}) => {
  const [formData, setFormData] = useState<FieldBuilder>({
    name: "",
    slug: "",
    field_type: "short_text",
    description: "",
    is_required: false,
    is_unique: false,
    options: [],
    validation_rules: {},
    default_value: null,
    layout_config: { width: "full", column: 1 }
  });

  useEffect(() => {
    if (field) {
      setFormData(field);
    }
  }, [field, open]);

  const handleSave = () => {
    if (formData.name.trim()) {
      // Gerar slug automaticamente se não estiver editando
      if (!isEditing) {
        formData.slug = formData.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      }
      
      onSave(formData);
      onOpenChange(false);
    }
  };

  const fieldTypeOptions = [
    { value: "short_text", label: "Texto Curto" },
    { value: "long_text", label: "Texto Longo" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Telefone" },
    { value: "url", label: "URL" },
    { value: "number", label: "Número" },
    { value: "currency", label: "Moeda" },
    { value: "date", label: "Data" },
    { value: "datetime", label: "Data e Hora" },
    { value: "checkbox", label: "Checkbox" },
    { value: "single_select", label: "Seleção Única" },
    { value: "multi_select", label: "Seleção Múltipla" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Campo" : "Novo Campo"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="field-name">Nome do Campo</Label>
            <Input
              id="field-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Nome, Email, Telefone..."
            />
          </div>

          <div>
            <Label htmlFor="field-type">Tipo de Campo</Label>
            <Select 
              value={formData.field_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="field-description">Descrição (opcional)</Label>
            <Input
              id="field-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito deste campo..."
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="field-required"
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
              />
              <Label htmlFor="field-required">Obrigatório</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="field-unique"
                checked={formData.is_unique}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_unique: checked }))}
              />
              <Label htmlFor="field-unique">Único</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            {isEditing ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewEntitySettings; 