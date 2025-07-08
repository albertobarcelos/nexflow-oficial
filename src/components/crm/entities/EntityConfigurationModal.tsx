import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Database, 
  Link, 
  Zap, 
  Shield, 
  Layout,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Settings,
  Globe,
  Users,
  BarChart,
  Type,
  AlignLeft,
  Mail,
  Phone,
  ExternalLink,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  CheckSquare,
  List,
  Filter,
  UserCheck,
  Upload,
  FileText
} from 'lucide-react';

interface EntityConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
}

interface EntityField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  description?: string;
  options?: string[];
  validation?: any;
  order: number;
}

interface EntityRelationship {
  id: string;
  name: string;
  targetEntity: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  description?: string;
}

interface EntityView {
  id: string;
  name: string;
  type: 'table' | 'card' | 'kanban' | 'calendar';
  fields: string[];
  filters?: any[];
  sorting?: any[];
  isDefault: boolean;
}

const fieldTypes = [
  { value: 'short_text', label: 'Texto Curto', icon: Type },
  { value: 'long_text', label: 'Texto Longo', icon: AlignLeft },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'url', label: 'URL', icon: ExternalLink },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'currency', label: 'Moeda', icon: DollarSign },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'datetime', label: 'Data e Hora', icon: Clock },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'single_select', label: 'Seleção Única', icon: List },
  { value: 'multi_select', label: 'Seleção Múltipla', icon: Filter },
  { value: 'user_select', label: 'Usuário', icon: UserCheck },
  { value: 'entity_reference', label: 'Referência', icon: Link },
  { value: 'file_upload', label: 'Arquivo', icon: Upload },
  { value: 'rich_text', label: 'Texto Rico', icon: FileText }
];

export function EntityConfigurationModal({ open, onOpenChange, entityId, entityName }: EntityConfigurationModalProps) {
  const [activeTab, setActiveTab] = useState('structure');
  const [entityData, setEntityData] = useState({
    name: entityName,
    description: '',
    isPublic: false,
    allowExternalAccess: false,
    enableApi: true,
    color: '#10b981',
    icon: 'database'
  });
  
  const [fields, setFields] = useState<EntityField[]>([
    { id: '1', name: 'Nome', type: 'short_text', required: true, unique: false, order: 1 },
    { id: '2', name: 'Descrição', type: 'long_text', required: false, unique: false, order: 2 }
  ]);
  
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [views, setViews] = useState<EntityView[]>([
    { 
      id: '1', 
      name: 'Visualização Padrão', 
      type: 'table', 
      fields: ['1', '2'], 
      isDefault: true 
    }
  ]);
  
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<EntityField | null>(null);

  const handleSave = () => {
    console.log('Salvando configurações da entidade:', { entityData, fields, relationships, views });
    onOpenChange(false);
  };

  const handleFieldDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedFields = Array.from(fields);
    const [movedField] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedField);
    
    setFields(reorderedFields.map((field, index) => ({ ...field, order: index + 1 })));
  };

  const addField = () => {
    setEditingField(null);
    setShowFieldModal(true);
  };

  const editField = (field: EntityField) => {
    setEditingField(field);
    setShowFieldModal(true);
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType?.icon || Type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Sidebar com Abas */}
          <div className="w-80 bg-gray-50 border-r flex flex-col">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Configurações: {entityName}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-1 gap-1 h-auto p-2 bg-transparent">
                <TabsTrigger 
                  value="structure" 
                  className="justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Database className="w-4 h-4" />
                  Estrutura e Campos
                </TabsTrigger>
                <TabsTrigger 
                  value="relationships" 
                  className="justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Link className="w-4 h-4" />
                  Relacionamentos
                </TabsTrigger>
                <TabsTrigger 
                  value="views" 
                  className="justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Layout className="w-4 h-4" />
                  Visualizações
                </TabsTrigger>
                <TabsTrigger 
                  value="automations" 
                  className="justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  Automações
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions" 
                  className="justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Shield className="w-4 h-4" />
                  Permissões
                </TabsTrigger>
                <TabsTrigger 
                  value="api" 
                  className="justify-start gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                  API e Integrações
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 flex flex-col">
            {/* Header com Preview */}
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entityData.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{entityData.name}</h3>
                    <p className="text-sm text-gray-500">
                      {fields.length} campos • {relationships.length} relacionamentos • {views.length} visualizações
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto">
              <Tabs value={activeTab} className="h-full">
                {/* Estrutura e Campos */}
                <TabsContent value="structure" className="p-6 space-y-6 m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="entity-name">Nome da Base</Label>
                          <Input
                            id="entity-name"
                            value={entityData.name}
                            onChange={(e) => setEntityData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="entity-color">Cor</Label>
                          <div className="flex gap-2">
                            <Input
                              id="entity-color"
                              type="color"
                              value={entityData.color}
                              onChange={(e) => setEntityData(prev => ({ ...prev, color: e.target.value }))}
                              className="w-16"
                            />
                            <Input
                              value={entityData.color}
                              onChange={(e) => setEntityData(prev => ({ ...prev, color: e.target.value }))}
                              className="flex-1 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="entity-description">Descrição</Label>
                        <Textarea
                          id="entity-description"
                          value={entityData.description}
                          onChange={(e) => setEntityData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o propósito desta base de dados..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Campos da Base</h3>
                      <p className="text-sm text-gray-500">
                        Arraste para reordenar. Clique para editar.
                      </p>
                    </div>
                    <Button onClick={addField} className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Campo
                    </Button>
                  </div>

                  <DragDropContext onDragEnd={handleFieldDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {fields.map((field, index) => {
                            const IconComponent = getFieldIcon(field.type);
                            return (
                              <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-sm'
                                    }`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div {...provided.dragHandleProps}>
                                          <GripVertical className="w-4 h-4 text-gray-400" />
                                        </div>
                                        
                                        <div 
                                          className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"
                                        >
                                          <IconComponent className="w-4 h-4 text-green-600" />
                                        </div>
                                        
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{field.name}</span>
                                            {field.required && (
                                              <Badge variant="destructive" className="text-xs">
                                                Obrigatório
                                              </Badge>
                                            )}
                                            {field.unique && (
                                              <Badge variant="secondary" className="text-xs">
                                                Único
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>{fieldTypes.find(ft => ft.value === field.type)?.label}</span>
                                            {field.description && (
                                              <>
                                                <span>•</span>
                                                <span className="truncate">{field.description}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => editField(field)}
                                          >
                                            Editar
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteField(field.id)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </TabsContent>

                {/* Relacionamentos */}
                <TabsContent value="relationships" className="p-6 space-y-6 m-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Link className="w-5 h-5 text-blue-600" />
                        Relacionamentos
                      </h3>
                      <p className="text-sm text-gray-500">
                        Configure conexões com outras bases de dados
                      </p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Relacionamento
                    </Button>
                  </div>

                  {relationships.length === 0 ? (
                    <Card className="p-8 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Link className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold mb-2">Nenhum relacionamento configurado</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Conecte esta base com outras para criar relações entre dados
                      </p>
                      <Button variant="outline">
                        Criar primeiro relacionamento
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {/* Lista de relacionamentos */}
                    </div>
                  )}
                </TabsContent>

                {/* Outras abas */}
                <TabsContent value="views" className="p-6">
                  <div className="text-center py-8">
                    <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Configuração de Visualizações</h3>
                    <p className="text-gray-500">Em desenvolvimento...</p>
                  </div>
                </TabsContent>

                <TabsContent value="automations" className="p-6">
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Automações da Base</h3>
                    <p className="text-gray-500">Em desenvolvimento...</p>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="p-6">
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Controle de Permissões</h3>
                    <p className="text-gray-500">Em desenvolvimento...</p>
                  </div>
                </TabsContent>

                <TabsContent value="api" className="p-6">
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">API e Integrações</h3>
                    <p className="text-gray-500">Em desenvolvimento...</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 