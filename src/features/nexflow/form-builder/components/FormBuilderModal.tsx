import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormBuilderHeader } from "./FormBuilderHeader";
import { FieldTypesSidebar, type FieldType } from "@/components/crm/flows/FieldTypesSidebar";
import { FormPreview } from "@/components/crm/flows/FormPreview";
import { FieldConfigurationModal } from "@/components/crm/flows/FieldConfigurationModal";
import { StageSelector } from "@/components/crm/flows/StageSelector";
import { DefaultValuesConfigModal } from "@/components/crm/flows/DefaultValuesConfigModal";
import { FormPreviewModal } from "@/components/crm/flows/FormPreviewModal";
import { NewStageModal } from "@/components/crm/flows/NewStageModal";
import { useFlowStages } from "@/hooks/useFlowStages";
import { FormInput, Layers, Users, Mail, Zap, Settings as SettingsIcon } from "lucide-react";
import type { FieldConfiguration } from "@/types/form-builder";

interface FormBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

export function FormBuilderModal({ open, onOpenChange, flowId, flowName }: FormBuilderModalProps) {
  const [activeTab, setActiveTab] = useState("initial-form");
  const [formTitle, setFormTitle] = useState(flowName);
  const [selectedField, setSelectedField] = useState<FieldConfiguration | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [pendingField, setPendingField] = useState<FieldConfiguration | null>(null);
  const [defaultValuesConfigOpen, setDefaultValuesConfigOpen] = useState(false);
  const [formPreviewOpen, setFormPreviewOpen] = useState(false);
  const [newStageModalOpen, setNewStageModalOpen] = useState(false);
  const [editStageModalOpen, setEditStageModalOpen] = useState(false);
  const [selectedStageForEdit, setSelectedStageForEdit] = useState<any>(null);
  const [isPublicFlow, setIsPublicFlow] = useState(false);
  const [autoNotifications, setAutoNotifications] = useState(true);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [localFields, setLocalFields] = useState<FieldConfiguration[]>([]);
  const [pendingPosition, setPendingPosition] = useState<number | null>(null);

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

  useEffect(() => {
    if (!open) {
      setSelectedField(null);
      setConfigModalOpen(false);
      setPendingField(null);
      setPendingPosition(null);
      setDefaultValuesConfigOpen(false);
      setFormPreviewOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (stages.length > 0 && !selectedStageId && activeTab === "stages") {
      setSelectedStageId(stages[0].id);
    }
  }, [stages, selectedStageId, activeTab]);

  const handleSaveAll = async () => {
    setHasUnsavedChanges(false);
    // Implementar lógica de salvamento
  };

  const handlePreview = () => {
    setFormPreviewOpen(true);
  };

  const selectedStage = stages.find((s) => s.id === selectedStageId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] max-h-[900px] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Form Builder: {flowName}</DialogTitle>
          <DialogDescription>Configure os campos e etapas do flow</DialogDescription>
        </DialogHeader>

        <FormBuilderHeader
          formTitle={formTitle}
          setFormTitle={setFormTitle}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSaveAll}
          onPreview={handlePreview}
          onClose={() => onOpenChange(false)}
        />

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-gray-200 px-6">
              <TabsList className="bg-transparent">
                <TabsTrigger value="initial-form" className="flex items-center gap-2">
                  <FormInput className="w-4 h-4" />
                  Formulário Inicial
                </TabsTrigger>
                <TabsTrigger value="stages" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Fases
                </TabsTrigger>
                <TabsTrigger value="people" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Pessoas
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="automations" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Automações
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Configurações
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="initial-form" className="m-0 h-full">
                <div className="flex h-full">
                  <FieldTypesSidebar
                    onFieldDragStart={(fieldType) => {
                      setPendingPosition(null);
                      setPendingField({
                        id: crypto.randomUUID(),
                        type: fieldType.id,
                        label: fieldType.label,
                        required: false,
                        editableInOtherStages: true,
                        uniqueValue: false,
                        compactView: false,
                        order: localFields.length,
                      });
                      setConfigModalOpen(true);
                    }}
                  />
                  <div className="flex-1 p-6 overflow-y-auto">
                    <FormPreview
                      title={formTitle}
                      onTitleChange={setFormTitle}
                      fields={localFields}
                      onFieldAdd={(fieldType, position) => {
                        setPendingPosition(position ?? localFields.length);
                        setPendingField({
                          id: crypto.randomUUID(),
                          type: fieldType.id,
                          label: fieldType.label,
                          required: false,
                          editableInOtherStages: true,
                          uniqueValue: false,
                          compactView: false,
                          order: position ?? localFields.length,
                        });
                        setConfigModalOpen(true);
                      }}
                      onFieldEdit={(field) => {
                        setSelectedField(field);
                        setPendingField(null);
                        setPendingPosition(null);
                        setConfigModalOpen(true);
                      }}
                      onFieldDelete={(fieldId) => {
                        setLocalFields((prev) => prev.filter((f) => f.id !== fieldId));
                        setHasUnsavedChanges(true);
                      }}
                      onFieldReorder={(fields) => {
                        setLocalFields(fields);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stages" className="m-0 h-full">
                <div className="flex h-full">
                  <div className="flex-1 p-6 overflow-y-auto">
                    <StageSelector
                      stages={stages}
                      selectedStageId={selectedStageId}
                      onStageSelect={setSelectedStageId}
                      onCreateStage={createStage}
                      isLoading={isLoadingStages}
                      isCreating={isCreatingStage}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="people" className="m-0 h-full">
                <div className="flex h-full p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração de Pessoas</h2>
                      <p className="text-gray-600">Configure permissões e responsabilidades no flow.</p>
                    </div>
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
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="m-0 h-full">
                <div className="flex h-full p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração de Email</h2>
                      <p className="text-gray-600">Configure notificações e templates de email para o flow.</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações por Fase</h3>
                      <div className="space-y-4">
                        {stages.map((stage) => (
                          <div key={stage.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{stage.name}</h4>
                              <p className="text-sm text-gray-600">Configurar emails automáticos para esta fase</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Mail className="w-4 h-4 mr-2" />
                              Configurar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="automations" className="m-0 h-full">
                <div className="flex h-full p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Automações</h2>
                      <p className="text-gray-600">Configure automações e regras para o flow.</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <p className="text-gray-500">Em desenvolvimento...</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="m-0 h-full">
                <div className="flex h-full p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h2>
                      <p className="text-gray-600">Configure opções avançadas do flow.</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Flow Público</Label>
                          <p className="text-xs text-gray-500">Permitir acesso público ao flow</p>
                        </div>
                        <Switch checked={isPublicFlow} onCheckedChange={setIsPublicFlow} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Notificações Automáticas</Label>
                          <p className="text-xs text-gray-500">Enviar notificações automaticamente</p>
                        </div>
                        <Switch checked={autoNotifications} onCheckedChange={setAutoNotifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Permitir Duplicatas</Label>
                          <p className="text-xs text-gray-500">Permitir criação de itens duplicados</p>
                        </div>
                        <Switch checked={allowDuplicates} onCheckedChange={setAllowDuplicates} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Arquivar Automaticamente</Label>
                          <p className="text-xs text-gray-500">Arquivar itens concluídos automaticamente</p>
                        </div>
                        <Switch checked={autoArchive} onCheckedChange={setAutoArchive} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <FieldConfigurationModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          field={selectedField ?? pendingField}
          onSave={(field) => {
            if (selectedField) {
              setLocalFields((prev) =>
                prev.map((f) => (f.id === field.id ? field : f))
              );
            } else {
              setLocalFields((prev) => {
                const next = [...prev];
                const at = pendingPosition ?? prev.length;
                next.splice(at, 0, field);
                return next;
              });
            }
            setConfigModalOpen(false);
            setPendingField(null);
            setSelectedField(null);
            setPendingPosition(null);
            setHasUnsavedChanges(true);
          }}
          onCancel={() => {
            setConfigModalOpen(false);
            setPendingField(null);
            setSelectedField(null);
            setPendingPosition(null);
          }}
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

        <NewStageModal
          open={newStageModalOpen}
          onOpenChange={setNewStageModalOpen}
          onCreateStage={(data) => {
            createStage(data);
            setNewStageModalOpen(false);
          }}
          isCreating={isCreatingStage}
        />
      </DialogContent>
    </Dialog>
  );
}

