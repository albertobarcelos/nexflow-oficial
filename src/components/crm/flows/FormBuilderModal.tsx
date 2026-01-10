// Re-export from refactored component
export { FormBuilderModal } from "@/features/nexflow/form-builder/components/FormBuilderModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  Database,
  Plus,
  ArrowRight,
  Clock,
  Tag,
  FileText,
  MessageSquare,
  Webhook,
  Settings,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

// Componentes internos
import { FieldTypesSidebar } from './FieldTypesSidebar';
import { FormPreview } from './FormPreview';
import { FieldConfigurationModal } from './FieldConfigurationModal';
import { StageSelector } from './StageSelector';

// Componentes para os novos modais
// AIDEV-NOTE: FlowBasesConfigModal removido durante simplificação - sistema focado apenas em deals
import { DefaultValuesConfigModal } from './DefaultValuesConfigModal';
import { FormPreviewModal } from './FormPreviewModal';
import { NewStageModal } from './NewStageModal';

// Hooks personalizados
// AIDEV-NOTE: Removido useFormFields e useFlowBases - sistema simplificado para focar apenas em deals
import { useFlowStages } from '@/hooks/useFlowStages';

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
  
  // Estados para modais de etapas
  const [newStageModalOpen, setNewStageModalOpen] = useState(false);
  const [editStageModalOpen, setEditStageModalOpen] = useState(false);
  const [selectedStageForEdit, setSelectedStageForEdit] = useState<any>(null);

  // Estados para configurações avançadas
  const [isPublicFlow, setIsPublicFlow] = useState(false);
  const [autoNotifications, setAutoNotifications] = useState(true);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estado para aba de fases
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Hook para buscar fases do flow
  const {
    stages,
    isLoading: isLoadingStages,
    createStage,
    updateStage,
    deleteStage,
    isCreating: isCreatingStage,
    isUpdating: isUpdatingStage,
    isDeleting: isDeletingStage,
  } = useFlowStages(flowId);

  // Hook para buscar bases do flow
  // AIDEV-NOTE: Removido useFlowBases - sistema simplificado para focar apenas em deals
    const linkedBases: any[] = [];
    const isLoadingBases = false;

  // Debug log para verificar o estado das bases
  useEffect(() => {
    console.log('🔍 Debug FormBuilderModal - linkedBases:', {
      linkedBases,
      isLoadingBases,
      flowId,
      length: linkedBases?.length
    });
  }, [linkedBases, isLoadingBases, flowId]);

  // AIDEV-NOTE: Removido useFormFields para initial - sistema simplificado para focar apenas em deals
  const initialFields: any[] = [];
  const isLoadingInitial = false;
  const saveInitialField = () => Promise.resolve();
  const deleteInitialField = () => {};
  const reorderInitialFields = () => {};
  const isSavingInitial = false;

  // AIDEV-NOTE: Removido useFormFields para stage - sistema simplificado para focar apenas em deals
  const stageFields: any[] = [];
  const isLoadingStage = false;
  const saveStageField = () => Promise.resolve();
  const deleteStageField = () => {};
  const reorderStageFields = () => {};
  const isSavingStage = false;

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
      if (activeTab === 'settings') {
        // Salvar configurações avançadas
        await handleSaveAdvancedSettings();
      } else {
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
      }
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleStageSelect = useCallback((stageId: string) => {
    setSelectedStageId(stageId);
    // Limpar campos locais para carregar os da nova fase
    setLocalFields([]);
  }, []);

  // =====================================================
  // FUNÇÕES PARA CONFIGURAÇÕES AVANÇADAS
  // =====================================================
  
  // Funções wrapper para rastrear mudanças
  const handlePublicFlowChange = useCallback((checked: boolean) => {
    setIsPublicFlow(checked);
    setHasUnsavedChanges(true);
  }, []);

  const handleAutoNotificationsChange = useCallback((checked: boolean) => {
    setAutoNotifications(checked);
    setHasUnsavedChanges(true);
  }, []);

  const handleAllowDuplicatesChange = useCallback((checked: boolean) => {
    setAllowDuplicates(checked);
    setHasUnsavedChanges(true);
  }, []);

  const handleAutoArchiveChange = useCallback((checked: boolean) => {
    setAutoArchive(checked);
    setHasUnsavedChanges(true);
  }, []);
  
  const handleSaveAdvancedSettings = useCallback(async () => {
    try {
      // TODO: Implementar salvamento das configurações avançadas no banco
      const settings = {
        is_public: isPublicFlow,
        auto_notifications: autoNotifications,
        allow_duplicates: allowDuplicates,
        auto_archive: autoArchive,
      };
      
      console.log('Salvando configurações avançadas:', settings);
      setHasUnsavedChanges(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error('Erro ao salvar configurações:', error);
    }
  }, [isPublicFlow, autoNotifications, allowDuplicates, autoArchive]);

  // =====================================================
  // FUNÇÕES PARA MANIPULAÇÃO DE ETAPAS
  // =====================================================
  
  const handleCreateStage = useCallback(async (stageData: any) => {
    try {
      createStage(stageData);
      setNewStageModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
    }
  }, [createStage]);

  const handleEditStage = useCallback((stage: any) => {
    setSelectedStageForEdit(stage);
    setEditStageModalOpen(true);
  }, []);

  const handleUpdateStage = useCallback(async (updatedStageData: any) => {
    try {
      if (selectedStageForEdit) {
        updateStage({ 
          stageId: selectedStageForEdit.id, 
          name: updatedStageData.name 
        });
        setEditStageModalOpen(false);
        setSelectedStageForEdit(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
    }
  }, [updateStage, selectedStageForEdit]);

  const handleDeleteStage = useCallback(async (stageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etapa? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      deleteStage(stageId);
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
    }
  }, [deleteStage]);

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
                  className={`${hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={handleSaveAll}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {hasUnsavedChanges ? 'Salvar Alterações' : 'Salvar'}
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
                      const showUnsavedIndicator = tab.id === 'settings' && hasUnsavedChanges;
                      return (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 hover:bg-gray-100 transition-all rounded-none"
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                          {showUnsavedIndicator && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full ml-1" />
                          )}
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

                {/* Aba de Pessoas */}
                <TabsContent value="people" className="m-0 h-full">
                  <div className="flex h-full">
                    {/* Área principal */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração de Pessoas</h2>
                          <p className="text-gray-600">Configure permissões e responsabilidades no flow.</p>
                        </div>

                        {/* Configurações de Responsáveis */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsáveis por Fase</h3>
                          <div className="space-y-4">
                            {stages.map((stage) => (
                              <div key={stage.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-900">{stage.name}</h4>
                                  <p className="text-sm text-gray-600">Definir responsáveis para esta fase</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Users className="w-4 h-4 mr-2" />
                                  Configurar
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Permissões Gerais */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissões Gerais</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">Todos podem criar itens</Label>
                                <p className="text-xs text-gray-500">Permitir que qualquer usuário crie novos itens</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">Todos podem editar itens</Label>
                                <p className="text-xs text-gray-500">Permitir edição de itens por qualquer usuário</p>
                              </div>
                              <Switch />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">Todos podem excluir itens</Label>
                                <p className="text-xs text-gray-500">Permitir exclusão de itens por qualquer usuário</p>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Usuários do Flow</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total de usuários:</span>
                              <span className="font-medium">5</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Administradores:</span>
                              <span className="font-medium">2</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Editores:</span>
                              <span className="font-medium">2</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Visualizadores:</span>
                              <span className="font-medium">1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="m-0 h-full">
                  <div className="flex h-full">
                    {/* Área principal */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração de Email</h2>
                          <p className="text-gray-600">Configure notificações e templates de email para o flow.</p>
                        </div>

                        {/* Notificações por Fase */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações por Fase</h3>
                          <div className="space-y-4">
                            {stages.map((stage) => (
                              <div key={stage.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-900">{stage.name}</h4>
                                  <p className="text-sm text-gray-600">Configurar emails automáticos para esta fase</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Switch />
                                  <Button variant="outline" size="sm">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Configurar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Configurações Gerais de Email */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Gerais</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">Notificar criação de itens</Label>
                                <p className="text-xs text-gray-500">Enviar email quando novos itens forem criados</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">Notificar mudança de fase</Label>
                                <p className="text-xs text-gray-500">Enviar email quando itens mudarem de fase</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">Notificar conclusão</Label>
                                <p className="text-xs text-gray-500">Enviar email quando itens forem concluídos</p>
                              </div>
                              <Switch />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium">Resumo diário</Label>
                                <p className="text-xs text-gray-500">Enviar resumo diário das atividades</p>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </div>

                        {/* Templates de Email */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates de Email</h3>
                          <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                              <Mail className="w-4 h-4 mr-2" />
                              Template de Boas-vindas
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Mail className="w-4 h-4 mr-2" />
                              Template de Mudança de Fase
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Mail className="w-4 h-4 mr-2" />
                              Template de Conclusão
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Mail className="w-4 h-4 mr-2" />
                              Template de Lembrete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Estatísticas de Email</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Emails enviados hoje:</span>
                              <span className="font-medium">12</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Taxa de abertura:</span>
                              <span className="font-medium">68%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Taxa de clique:</span>
                              <span className="font-medium">24%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Templates ativos:</span>
                              <span className="font-medium">4</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-3">Configurações SMTP</h4>
                          <Button variant="outline" className="w-full">
                            <SettingsIcon className="w-4 h-4 mr-2" />
                            Configurar SMTP
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="automations" className="m-0 h-full">
                  <div className="flex h-full">
                    {/* Área principal */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Automações</h2>
                            <p className="text-gray-600">Configure automações para otimizar seu fluxo de trabalho.</p>
                          </div>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Automação
                          </Button>
                        </div>

                        {/* Automações por Trigger */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automações por Evento</h3>
                          <div className="space-y-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">Quando item é criado</h4>
                                    <p className="text-sm text-gray-600">Executar ações automaticamente</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch defaultChecked />
                                  <Button variant="outline" size="sm">
                                    Configurar
                                  </Button>
                                </div>
                              </div>
                              <div className="ml-11 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">2 ações configuradas</span>
                              </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <ArrowRight className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">Quando muda de fase</h4>
                                    <p className="text-sm text-gray-600">Ações baseadas na mudança de estágio</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch />
                                  <Button variant="outline" size="sm">
                                    Configurar
                                  </Button>
                                </div>
                              </div>
                              <div className="ml-11 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">Nenhuma ação</span>
                              </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">Baseado em tempo</h4>
                                    <p className="text-sm text-gray-600">Ações agendadas ou recorrentes</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch />
                                  <Button variant="outline" size="sm">
                                    Configurar
                                  </Button>
                                </div>
                              </div>
                              <div className="ml-11 text-sm text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">Nenhuma ação</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ações Disponíveis */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Disponíveis</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center gap-3 mb-2">
                                <Mail className="w-5 h-5 text-blue-600" />
                                <h4 className="font-medium">Enviar Email</h4>
                              </div>
                              <p className="text-sm text-gray-600">Enviar notificação por email</p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center gap-3 mb-2">
                                <Users className="w-5 h-5 text-green-600" />
                                <h4 className="font-medium">Atribuir Responsável</h4>
                              </div>
                              <p className="text-sm text-gray-600">Definir responsável automaticamente</p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center gap-3 mb-2">
                                <Tag className="w-5 h-5 text-purple-600" />
                                <h4 className="font-medium">Adicionar Tag</h4>
                              </div>
                              <p className="text-sm text-gray-600">Marcar item com tags específicas</p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-5 h-5 text-orange-600" />
                                <h4 className="font-medium">Criar Tarefa</h4>
                              </div>
                              <p className="text-sm text-gray-600">Gerar tarefa automaticamente</p>
                            </div>
                          </div>
                        </div>

                        {/* Automações Ativas */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automações Ativas</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div>
                                  <h4 className="font-medium text-gray-900">Notificar criação de lead</h4>
                                  <p className="text-sm text-gray-600">Enviar email para equipe de vendas</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Executada 24x hoje</span>
                                <Button variant="outline" size="sm">
                                  Editar
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-center p-8 text-gray-500">
                              <div className="text-center">
                                <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p>Nenhuma automação adicional configurada</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Automações ativas:</span>
                              <span className="font-medium">1</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Execuções hoje:</span>
                              <span className="font-medium">24</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Taxa de sucesso:</span>
                              <span className="font-medium">98%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tempo médio:</span>
                              <span className="font-medium">1.2s</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-3">Integrações</h4>
                          <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Slack
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Webhook className="w-4 h-4 mr-2" />
                              Webhook
                            </Button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-3">Logs de Execução</h4>
                          <Button variant="outline" className="w-full">
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Logs
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="m-0 h-full">
                  <div className="p-6 overflow-y-auto h-full">
                    <div className="max-w-6xl mx-auto space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações do Flow</h2>
                          <p className="text-gray-600">
                            Configure as etapas, automações e comportamentos do seu flow.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar como Template
                          </Button>
                          <Button>
                            Atualizar Flow
                          </Button>
                        </div>
                      </div>

                      {/* Flow Configuration */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Configuração do Flow</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="flowName">Nome do Flow</Label>
                            <Input
                              id="flowName"
                              value={formTitle}
                              onChange={(e) => setFormTitle(e.target.value)}
                              placeholder="Ex: Vendas Completo"
                            />
                          </div>
                          <div>
                            <Label htmlFor="flowDescription">Descrição</Label>
                            <Textarea
                              id="flowDescription"
                              placeholder="Descreva o propósito deste flow"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Stages */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Etapas do Flow
                            <Button 
                              size="sm"
                              onClick={() => setNewStageModalOpen(true)}
                              disabled={isCreatingStage}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isCreatingStage ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Criando...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adicionar Etapa
                                </>
                              )}
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isLoadingStages ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                              <span className="ml-2 text-gray-500">Carregando etapas...</span>
                            </div>
                          ) : stages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm">Nenhuma etapa configurada</p>
                              <p className="text-xs">Clique em "Adicionar Etapa" para começar</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {stages.map((stage, index) => (
                                <div
                                  key={stage.id}
                                  className="border rounded-lg p-4 space-y-2"
                                  style={{ borderColor: stage.color || '#94A3B8' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <Badge 
                                      style={{ 
                                        backgroundColor: stage.color || '#94A3B8', 
                                        color: 'white' 
                                      }}
                                    >
                                      {stage.order_index || index + 1}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditStage(stage)}
                                        disabled={isUpdatingStage}
                                        title="Editar etapa"
                                      >
                                        {isUpdatingStage ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Settings className="w-3 h-3" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteStage(stage.id)}
                                        disabled={isDeletingStage}
                                        title="Excluir etapa"
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        {isDeletingStage ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <h4 className="font-medium">{stage.name}</h4>
                                  <p className="text-sm text-gray-600">{stage.description || 'Sem descrição'}</p>
                                  <div className="flex gap-1">
                                    <Badge variant="outline">{stage.stage_type || 'active'}</Badge>
                                    {stage.is_final_stage && (
                                      <Badge variant="secondary">Final</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Automations */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Automações
                            <Button 
                              size="sm"
                              variant="outline"
                              disabled
                              title="Em breve - Funcionalidade em desenvolvimento"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar Automação
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Placeholder para automações */}
                            <div className="text-center py-8 text-gray-500">
                              <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm font-medium">Automações em desenvolvimento</p>
                              <p className="text-xs">
                                Em breve você poderá configurar automações como:
                              </p>
                              <div className="mt-3 text-xs space-y-1">
                                <p>• Envio automático de emails</p>
                                <p>• Movimentação de etapas por tempo</p>
                                <p>• Notificações personalizadas</p>
                                <p>• Integração com webhooks</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Configurações Avançadas */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Configurações Avançadas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Flow público</Label>
                                <p className="text-xs text-gray-500">
                                  Permite acesso ao flow sem autenticação
                                </p>
                              </div>
                              <Switch 
                                checked={isPublicFlow}
                                onCheckedChange={handlePublicFlowChange}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Notificações automáticas</Label>
                                <p className="text-xs text-gray-500">
                                  Enviar notificações quando itens são criados ou movidos
                                </p>
                              </div>
                              <Switch 
                                checked={autoNotifications}
                                onCheckedChange={handleAutoNotificationsChange}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Permitir duplicatas</Label>
                                <p className="text-xs text-gray-500">
                                  Permitir criação de itens com dados similares
                                </p>
                              </div>
                              <Switch 
                                checked={allowDuplicates}
                                onCheckedChange={handleAllowDuplicatesChange}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Auto-arquivar</Label>
                                <p className="text-xs text-gray-500">
                                  Arquivar automaticamente itens concluídos após 30 dias
                                </p>
                              </div>
                              <Switch 
                                checked={autoArchive}
                                onCheckedChange={handleAutoArchiveChange}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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

      {/* AIDEV-NOTE: FlowBasesConfigModal removido - sistema simplificado para deals */}

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

      {/* Modal de criação de etapa */}
      <NewStageModal
        open={newStageModalOpen}
        onOpenChange={setNewStageModalOpen}
        onCreateStage={handleCreateStage}
        isCreating={isCreatingStage}
      />

      {/* Modal de edição de etapa */}
      {selectedStageForEdit && (
        <NewStageModal
          open={editStageModalOpen}
          onOpenChange={setEditStageModalOpen}
          onCreateStage={handleUpdateStage}
          isCreating={isUpdatingStage}
          initialData={selectedStageForEdit}
        />
      )}
    </>
  );
}