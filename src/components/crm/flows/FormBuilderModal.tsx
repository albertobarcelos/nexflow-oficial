import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  FormInput, 
  Layers, 
  Users, 
  Mail, 
  Zap, 
  Settings as SettingsIcon,
  X,
  HelpCircle,
  Eye,
  Save,
  Info,
  Loader2,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

// Componentes internos
import { FieldTypesSidebar } from './FieldTypesSidebar';
import { FormPreview } from './FormPreview';
import { FieldConfigurationModal } from './FieldConfigurationModal';
import { StageSelector } from './StageSelector';

// Componentes para os novos modais
import { FlowBasesConfigModal } from './FlowBasesConfigModal';
import { DefaultValuesConfigModal } from './DefaultValuesConfigModal';
import { FormPreviewModal } from './FormPreviewModal';

// Hooks personalizados
import { useFormFields } from '@/hooks/useFormFields';
import { useFlowStages } from '@/hooks/useFlowStages';
import { useFlowBases } from '@/hooks/useFlowBases';

// Types
import { FieldConfiguration } from '@/types/form-builder';
import { FieldType } from './FieldTypesSidebar';

interface FormBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

export function FormBuilderModal({ open, onOpenChange, flowId, flowName }: FormBuilderModalProps) {
  const [activeTab, setActiveTab] = useState('initial-form');
  const [formTitle, setFormTitle] = useState(flowName);
  const [selectedField, setSelectedField] = useState<FieldConfiguration | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [pendingField, setPendingField] = useState<FieldConfiguration | null>(null);
  
  // Estados para novos modais
  const [basesConfigOpen, setBasesConfigOpen] = useState(false);
  const [defaultValuesConfigOpen, setDefaultValuesConfigOpen] = useState(false);
  const [formPreviewOpen, setFormPreviewOpen] = useState(false);
  
  // Estado para aba de fases
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Hook para buscar fases do flow
  const {
    stages,
    isLoading: isLoadingStages,
    createStage,
    isCreating: isCreatingStage,
  } = useFlowStages(flowId);

  // Hook para buscar bases do flow
  const { linkedBases, isLoading: isLoadingBases } = useFlowBases(flowId);

  // Debug log para verificar o estado das bases
  useEffect(() => {
    console.log('🔍 Debug FormBuilderModal - linkedBases:', {
      linkedBases,
      isLoadingBases,
      flowId,
      length: linkedBases?.length
    });
  }, [linkedBases, isLoadingBases, flowId]);

  // Hook para campos do formulário inicial
  const {
    fields: initialFields,
    isLoading: isLoadingInitial,
    saveField: saveInitialField,
    deleteField: deleteInitialField,
    reorderFields: reorderInitialFields,
    isSaving: isSavingInitial,
  } = useFormFields(flowId, 'initial');

  // Hook para campos das fases (usando stageId selecionado)
  const {
    fields: stageFields,
    isLoading: isLoadingStage,
    saveField: saveStageField,
    deleteField: deleteStageField,
    reorderFields: reorderStageFields,
    isSaving: isSavingStage,
  } = useFormFields(flowId, 'stage', selectedStageId || undefined);

  // Estado local para campos (será substituído pelos campos do banco)
  const [localFields, setLocalFields] = useState<FieldConfiguration[]>([]);

  // Reset states when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedField(null);
      setConfigModalOpen(false);
      setPendingField(null);
      setBasesConfigOpen(false);
      setDefaultValuesConfigOpen(false);
      setFormPreviewOpen(false);
    }
  }, [open]);

  // Selecionar primeira fase automaticamente quando carregar
  useEffect(() => {
    if (stages.length > 0 && !selectedStageId && activeTab === 'stages') {
      setSelectedStageId(stages[0].id);
    }
  }, [stages, selectedStageId, activeTab]);

  // Sincronizar campos do banco com estado local
  useEffect(() => {
    const safeInitialFields = Array.isArray(initialFields) ? initialFields : [];
    const safeStageFields = Array.isArray(stageFields) ? stageFields : [];
    
    if (activeTab === 'initial-form' && safeInitialFields.length > 0) {
      setLocalFields(prevFields => {
        // Só atualizar se os campos realmente mudaram
        const fieldsChanged = prevFields.length !== safeInitialFields.length || 
          prevFields.some((field, index) => field.id !== safeInitialFields[index]?.id);
        return fieldsChanged ? safeInitialFields : prevFields;
      });
    } else if (activeTab === 'stages' && safeStageFields.length > 0) {
      setLocalFields(prevFields => {
        // Só atualizar se os campos realmente mudaram
        const fieldsChanged = prevFields.length !== safeStageFields.length || 
          prevFields.some((field, index) => field.id !== safeStageFields[index]?.id);
        return fieldsChanged ? safeStageFields : prevFields;
      });
    } else if (activeTab === 'initial-form' && !isLoadingInitial && safeInitialFields.length === 0) {
      // Campos padrão para formulário inicial - só criar se não existir
      setLocalFields(prevFields => {
        if (prevFields.length === 0 || !prevFields.some(f => f.id === 'default-title')) {
          return [
            {
              id: 'default-title',
              type: 'text',
              label: 'Título',
              placeholder: 'Digite o título do item',
              required: true,
              editableInOtherStages: true,
              uniqueValue: false,
              compactView: false,
              order: 0
            }
          ];
        }
        return prevFields;
      });
    } else if (activeTab === 'stages' && !isLoadingStage && safeStageFields.length === 0) {
      setLocalFields(prevFields => prevFields.length > 0 ? [] : prevFields);
    }
  }, [activeTab, initialFields, stageFields, isLoadingInitial, isLoadingStage]);

  // Efeito para abrir automaticamente o modal quando um campo pendente é adicionado
  useEffect(() => {
    if (pendingField) {
      setSelectedField(pendingField);
      setConfigModalOpen(true);
      setPendingField(null);
    }
  }, [pendingField]);

  const handleFieldAdd = useCallback((fieldType: FieldType, position?: number) => {
    const newField: FieldConfiguration = {
      id: `field_${Date.now()}`,
      type: fieldType.id,
      label: fieldType.label,
      placeholder: `Digite ${fieldType.label.toLowerCase()}`,
      required: false,
      editableInOtherStages: true,
      uniqueValue: false,
      compactView: false,
      order: position !== undefined ? position : localFields.length
    };

    if (position !== undefined) {
      const newFields = [...localFields];
      newFields.splice(position, 0, newField);
      const reorderedFields = newFields.map((field, index) => ({
        ...field,
        order: index
      }));
      setLocalFields(reorderedFields);
    } else {
      setLocalFields([...localFields, newField]);
    }

    // Marcar como campo pendente para abrir automaticamente o modal
    setPendingField(newField);
  }, [localFields]);

  const handleFieldEdit = useCallback((field: FieldConfiguration) => {
    setSelectedField(field);
    setConfigModalOpen(true);
  }, []);

  const handleFieldDelete = useCallback((fieldId: string) => {
    if (fieldId.startsWith('field_')) {
      // Campo novo, apenas remover do estado local
      setLocalFields(localFields.filter(f => f.id !== fieldId));
    } else {
      // Campo existente, deletar do banco
      if (activeTab === 'initial-form') {
        deleteInitialField(fieldId);
      } else {
        deleteStageField(fieldId);
      }
    }
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }, [localFields, activeTab, deleteInitialField, deleteStageField, selectedField]);

  const handleFieldReorder = useCallback((reorderedFields: FieldConfiguration[]) => {
    setLocalFields(reorderedFields);
    
    // Salvar reordenação no banco apenas para campos existentes
    const existingFields = reorderedFields.filter(f => !f.id.startsWith('field_'));
    if (existingFields.length > 0) {
      if (activeTab === 'initial-form') {
        reorderInitialFields(existingFields);
      } else {
        reorderStageFields(existingFields);
      }
    }
  }, [activeTab, reorderInitialFields, reorderStageFields]);

  const handleFieldSave = useCallback((updatedField: FieldConfiguration) => {
    // Atualizar estado local
    setLocalFields(localFields.map(f => f.id === updatedField.id ? updatedField : f));
    
    // Salvar no banco
    if (activeTab === 'initial-form') {
      saveInitialField(updatedField);
    } else {
      saveStageField(updatedField);
    }
    
    setSelectedField(null);
    setConfigModalOpen(false);
  }, [localFields, activeTab, saveInitialField, saveStageField]);

  const handleFieldCancel = useCallback(() => {
    // Se era um campo novo (recém adicionado), remover da lista
    if (selectedField && selectedField.id.startsWith('field_')) {
      // Verificar se o campo foi adicionado recentemente (últimos 5 segundos)
      const fieldTimestamp = parseInt(selectedField.id.replace('field_', ''));
      const now = Date.now();
      if (now - fieldTimestamp < 5000) { // 5 segundos
        setLocalFields(localFields.filter(f => f.id !== selectedField.id));
      }
    }
    setSelectedField(null);
    setConfigModalOpen(false);
    setPendingField(null);
  }, [selectedField, localFields]);

  const handleSaveAll = async () => {
    try {
      // Salvar todos os campos novos
      const newFields = localFields.filter(f => f.id.startsWith('field_'));
      for (const field of newFields) {
        if (activeTab === 'initial-form') {
          saveInitialField(field);
        } else {
          saveStageField(field);
        }
      }
      toast.success('Formulário salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar formulário');
    }
  };

  const handleStageSelect = useCallback((stageId: string) => {
    setSelectedStageId(stageId);
    // Limpar campos locais para carregar os da nova fase
    setLocalFields([]);
  }, []);

  const tabs = [
    { 
      id: 'initial-form', 
      label: 'Formulário inicial', 
      icon: FormInput 
    },
    { 
      id: 'stages', 
      label: 'Fases', 
      icon: Layers 
    },
    { 
      id: 'people', 
      label: 'Pessoas', 
      icon: Users 
    },
    { 
      id: 'email', 
      label: 'Email', 
      icon: Mail 
    },
    { 
      id: 'automations', 
      label: 'Automações', 
      icon: Zap 
    },
    { 
      id: 'settings', 
      label: 'Configurações do pipe', 
      icon: SettingsIcon 
    }
  ];

  const isLoading = activeTab === 'initial-form' ? isLoadingInitial : isLoadingStage;
  const isSaving = activeTab === 'initial-form' ? isSavingInitial : isSavingStage;
  const selectedStage = stages.find(s => s.id === selectedStageId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
          <div className="flex flex-col h-full">
            {/* Header estilo Pipefy */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">F</span>
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-semibold text-gray-800">
                      Configurações - {flowName}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{localFields.length} campos</span>
                      <span>•</span>
                      <span>{stages.length} etapas</span>
                      <span>•</span>
                      <span>{Array.isArray(linkedBases) ? linkedBases.length : 0} bases</span>
                      <span>•</span>
                      <span>0 automações</span>
                    </DialogDescription>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormPreviewOpen(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Abas horizontais estilo Pipefy */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b border-gray-200 bg-gray-50">
                <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                  <div className="flex">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 hover:bg-gray-100 transition-all rounded-none"
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </TabsTrigger>
                      );
                    })}
                  </div>
                </TabsList>
              </div>

              {/* Conteúdo das abas - Layout 3 colunas estilo Pipefy */}
              <div className="flex-1 overflow-hidden">
                <TabsContent value="initial-form" className="m-0 h-full">
                  <div className="flex h-full">
                    {/* Sidebar de tipos de campos */}
                    <FieldTypesSidebar />
                    
                    {/* Área central de preview */}
                    <FormPreview
                      title="Formulário Inicial"
                      onTitleChange={setFormTitle}
                      fields={localFields}
                      onFieldAdd={handleFieldAdd}
                      onFieldEdit={handleFieldEdit}
                      onFieldDelete={handleFieldDelete}
                      onFieldReorder={handleFieldReorder}
                      emptyStateTitle="Comece a criar seu formulário inicial"
                      emptyStateDescription="arrastando e soltando campos nesse espaço"
                      showPhaseSelector={false}
                      isLoading={isLoading}
                    />
                    
                    {/* Painel de configurações com novos botões */}
                    <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
                      <div className="space-y-6">
                        {/* Configurações Principais */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Configurações do Formulário</h3>
                          
                          {/* Botões de configuração */}
                          <div className="space-y-3 mb-6">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setBasesConfigOpen(true)}
                            >
                              <Database className="w-4 h-4 mr-2" />
                              Configurar Bases
                              <Badge variant="outline" className="ml-auto">
                                {Array.isArray(linkedBases) ? linkedBases.length : 0}
                              </Badge>
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setDefaultValuesConfigOpen(true)}
                            >
                              <SettingsIcon className="w-4 h-4 mr-2" />
                              Dados Padrão
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setFormPreviewOpen(true)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview do Formulário
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="form-title">Nome do formulário</Label>
                              <Input
                                id="form-title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Digite o nome do formulário"
                              />
                            </div>
                            
                            <div className="space-y-3">
                              <Label>Opções do formulário</Label>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Formulário público</Label>
                                    <p className="text-xs text-gray-500">
                                      Permite acesso sem login
                                    </p>
                                  </div>
                                  <Switch />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Notificações por email</Label>
                                    <p className="text-xs text-gray-500">
                                      Enviar notificações de novos itens
                                    </p>
                                  </div>
                                  <Switch defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Permitir duplicatas</Label>
                                    <p className="text-xs text-gray-500">
                                      Permitir itens com dados similares
                                    </p>
                                  </div>
                                  <Switch />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Estatísticas */}
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-3">Estatísticas</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total de campos:</span>
                              <span className="font-medium">{localFields.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Campos obrigatórios:</span>
                              <span className="font-medium">{localFields.filter(f => f.required).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Campos únicos:</span>
                              <span className="font-medium">{localFields.filter(f => f.uniqueValue).length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bases vinculadas:</span>
                              <span className="font-medium">{Array.isArray(linkedBases) ? linkedBases.length : 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Informação sobre bases */}
                        {Array.isArray(linkedBases) && linkedBases.length > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <h4 className="font-medium mb-3">Bases Vinculadas</h4>
                            <div className="space-y-2">
                              {linkedBases.map((flowBase) => (
                                <div key={flowBase.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">{flowBase.base?.name}</span>
                                  <Badge variant={flowBase.is_required ? "destructive" : "outline"} className="text-xs">
                                    {flowBase.is_required ? "Obrigatório" : "Opcional"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Aba de Fases com seletor de fase REAL */}
                <TabsContent value="stages" className="m-0 h-full">
                  <div className="flex h-full">
                    {/* Sidebar de tipos de campos */}
                    <FieldTypesSidebar />
                    
                    {/* Área central de preview com seletor de fase REAL */}
                    <div className="flex-1 flex flex-col bg-white">
                      {/* Header com seletor de fases */}
                      <div className="p-6 border-b border-gray-200 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-gray-800">
                            Campos por Fase
                          </h2>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="text-sm">
                              Condicionais em campos
                            </Button>
                            <Button variant="outline" size="sm" className="text-sm">
                              Opções Avançadas
                            </Button>
                          </div>
                        </div>

                        {/* Seletor de fases */}
                        <StageSelector
                          stages={stages}
                          selectedStageId={selectedStageId}
                          onStageSelect={handleStageSelect}
                          onCreateStage={createStage}
                          isLoading={isLoadingStages}
                          isCreating={isCreatingStage}
                        />
                      </div>

                      {/* Área de campos */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        {selectedStageId ? (
                          <div
                            className="min-h-[400px] space-y-2"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              try {
                                const fieldTypeData = e.dataTransfer.getData('application/json');
                                const fieldType: FieldType = JSON.parse(fieldTypeData);
                                handleFieldAdd(fieldType, localFields.length);
                              } catch (error) {
                                console.error('Error parsing dropped field:', error);
                              }
                            }}
                          >
                            {localFields.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                  <Layers className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">
                                  Configure os campos para {selectedStage?.name}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                  Arraste e solte campos da sidebar para começar
                                </p>
                              </div>
                            ) : (
                              localFields.map((field, index) => (
                                <div key={field.id} className="group bg-white border border-gray-200 rounded-lg mb-3 hover:shadow-sm transition-all cursor-pointer"
                                     onClick={() => handleFieldEdit(field)}>
                                  <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <span className="text-sm font-medium">{index + 1}</span>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-800">{field.label}</span>
                                          {field.required && (
                                            <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                              Obrigatório
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {field.type} • {field.placeholder}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFieldDelete(field.id);
                                        }}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Layers className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                              Selecione uma fase
                            </h3>
                            <p className="text-gray-500 text-sm">
                              Escolha uma fase para configurar seus campos específicos
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Painel de configurações para fases */}
                    <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Configurações da Fase</h3>
                          
                          {selectedStage ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Fase selecionada</Label>
                                <div className="p-3 bg-green-100 text-green-800 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="font-medium">{selectedStage.name}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <Label>Opções da fase</Label>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Campos obrigatórios</Label>
                                      <p className="text-xs text-gray-500">
                                        Exigir preenchimento para avançar
                                      </p>
                                    </div>
                                    <Switch defaultChecked />
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium">Auto-avançar</Label>
                                      <p className="text-xs text-gray-500">
                                        Avançar automaticamente quando completo
                                      </p>
                                    </div>
                                    <Switch />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Selecione uma fase para ver as configurações</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Lista de fases */}
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-3">Todas as Fases</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {stages.map((stage) => (
                              <div 
                                key={stage.id}
                                className={`p-2 rounded border cursor-pointer transition-colors ${
                                  selectedStageId === stage.id 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                onClick={() => handleStageSelect(stage.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    selectedStageId === stage.id ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></div>
                                  <span className="text-sm font-medium">{stage.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Outras abas */}
                <TabsContent value="people" className="m-0 h-full">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Configuração de Pessoas</h3>
                      <p className="text-gray-500">Em desenvolvimento</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="m-0 h-full">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Configuração de Email</h3>
                      <p className="text-gray-500">Em desenvolvimento</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="automations" className="m-0 h-full">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Configuração de Automações</h3>
                      <p className="text-gray-500">Em desenvolvimento</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="m-0 h-full">
                  <div className="flex h-full">
                    {/* Área principal de configurações */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header */}
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações do Flow</h2>
                          <p className="text-gray-600">
                            Configure as opções gerais e comportamentos do seu flow.
                          </p>
                        </div>

                        {/* Configurações de Bases */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">Bases Vinculadas</h3>
                              <p className="text-sm text-gray-600">
                                Configure quais entidades estarão disponíveis neste flow
                              </p>
                            </div>
                            <Button
                              onClick={() => setBasesConfigOpen(true)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Database className="w-4 h-4 mr-2" />
                              Configurar Bases
                            </Button>
                          </div>
                          
                          {/* Lista de bases vinculadas */}
                          <div className="space-y-3">
                            {Array.isArray(linkedBases) && linkedBases.length > 0 ? (
                              linkedBases.map((flowBase) => {
                                console.log('🔍 Renderizando base:', flowBase);
                                return (
                                  <div key={flowBase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <Database className="w-5 h-5 text-blue-600" />
                                      <div>
                                        <span className="font-medium text-gray-900">{flowBase.base?.name || flowBase.entity_name}</span>
                                        {(flowBase.base?.description || flowBase.entity_description) && (
                                          <p className="text-sm text-gray-600">{flowBase.base?.description || flowBase.entity_description}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {flowBase.is_primary && (
                                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                                          Principal
                                        </Badge>
                                      )}
                                      {flowBase.is_required && (
                                        <Badge variant="destructive">
                                          Obrigatório
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">
                                  {isLoadingBases ? 'Carregando bases...' : 'Nenhuma base vinculada'}
                                </p>
                                <p className="text-xs">
                                  {isLoadingBases ? 'Aguarde...' : 'Clique em "Configurar Bases" para adicionar'}
                                </p>
                                {!isLoadingBases && (
                                  <p className="text-xs text-red-500 mt-2">
                                    Debug: linkedBases = {JSON.stringify(linkedBases)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Configurações Gerais do Flow */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Gerais</h3>
                          
                          <div className="space-y-6">
                            {/* Nome do Flow */}
                            <div className="space-y-2">
                              <Label htmlFor="flow-name">Nome do Flow</Label>
                              <Input
                                id="flow-name"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Digite o nome do flow"
                              />
                            </div>

                            {/* Opções do Flow */}
                            <div className="space-y-4">
                              <Label className="text-base font-medium">Opções do Flow</Label>
                              
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Flow público</Label>
                                    <p className="text-xs text-gray-500">
                                      Permite acesso ao flow sem autenticação
                                    </p>
                                  </div>
                                  <Switch />
                                </div>
                                
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Notificações automáticas</Label>
                                    <p className="text-xs text-gray-500">
                                      Enviar notificações quando itens são criados ou movidos
                                    </p>
                                  </div>
                                  <Switch defaultChecked />
                                </div>
                                
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Permitir duplicatas</Label>
                                    <p className="text-xs text-gray-500">
                                      Permitir criação de itens com dados similares
                                    </p>
                                  </div>
                                  <Switch />
                                </div>
                                
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Auto-arquivar</Label>
                                    <p className="text-xs text-gray-500">
                                      Arquivar automaticamente itens concluídos após 30 dias
                                    </p>
                                  </div>
                                  <Switch />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Configurações Avançadas */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Avançadas</h3>
                          
                          <div className="space-y-4">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setDefaultValuesConfigOpen(true)}
                            >
                              <SettingsIcon className="w-4 h-4 mr-2" />
                              Configurar Valores Padrão
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => setFormPreviewOpen(true)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview do Formulário
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar de informações */}
                    <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
                      <div className="space-y-6">
                        {/* Estatísticas do Flow */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total de fases:</span>
                              <span className="font-medium">{stages.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Bases vinculadas:</span>
                              <span className="font-medium">{Array.isArray(linkedBases) ? linkedBases.length : 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Campos no formulário inicial:</span>
                              <span className="font-medium">{Array.isArray(initialFields) ? initialFields.length : 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Automações ativas:</span>
                              <span className="font-medium">0</span>
                            </div>
                          </div>
                        </div>

                        {/* Informações das Bases */}
                        {Array.isArray(linkedBases) && linkedBases.length > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <h4 className="font-medium mb-3">Detalhes das Bases</h4>
                            <div className="space-y-3">
                              {linkedBases.map((flowBase) => (
                                <div key={flowBase.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Database className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-sm">{flowBase.base?.name}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {flowBase.is_primary && (
                                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                        Principal
                                      </Badge>
                                    )}
                                    {flowBase.is_required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Obrigatório
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ajuda */}
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-3">Precisa de ajuda?</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>• <strong>Bases:</strong> Definem quais entidades estarão disponíveis</p>
                            <p>• <strong>Principal:</strong> Base padrão para novos itens</p>
                            <p>• <strong>Obrigatório:</strong> Deve ser preenchido obrigatoriamente</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuração de campo */}
      <FieldConfigurationModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        field={selectedField}
        onSave={handleFieldSave}
        onCancel={handleFieldCancel}
      />

      {/* Novos modais */}
      <FlowBasesConfigModal
        open={basesConfigOpen}
        onOpenChange={setBasesConfigOpen}
        flowId={flowId}
        flowName={flowName}
      />

      <DefaultValuesConfigModal
        open={defaultValuesConfigOpen}
        onOpenChange={setDefaultValuesConfigOpen}
        flowId={flowId}
        flowName={flowName}
      />

      <FormPreviewModal
        open={formPreviewOpen}
        onOpenChange={setFormPreviewOpen}
        flowId={flowId}
        flowName={flowName}
      />
    </>
  );
} 