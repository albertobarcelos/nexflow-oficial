// =====================================================
// COMPONENTE PARA CONSTRUÇÃO VISUAL DE FLOWS
// =====================================================
// AIDEV-NOTE: Interface visual para criação de flows modulares
// Permite arrastar/soltar stages e configurar automações

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, Copy, ArrowRight, Save } from 'lucide-react';
import { useFlowBuilder } from '@/hooks/useFlowBuilder';
import { useAuth } from '@/hooks/useAuth';
import { useClientStore } from '@/stores/clientStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface FlowStage {
  id?: string;
  name: string;
  description: string;
  color: string;
  order_index: number;
  stage_type: 'active' | 'won' | 'lost' | 'archived';
  is_final_stage: boolean;
}

interface FlowAutomation {
  name: string;
  description: string;
  source_stage: string;
  automation_type: 'duplicate' | 'move' | 'notify';
  trigger_condition: 'stage_change' | 'time_based' | 'field_change';
  target_flow_name?: string;
  visible_to_roles: string[];
}

interface FlowBuilderProps {
  onFlowCreated?: (flow: any) => void;
  initialTemplate?: string;
  flowId?: string | null;
}

const STAGE_COLORS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', 
  '#10B981', '#F97316', '#06B6D4', '#6B7280'
];

const STAGE_TYPES = [
  { value: 'active', label: 'Ativo', description: 'Etapa em andamento' },
  { value: 'won', label: 'Ganho', description: 'Etapa de sucesso' },
  { value: 'lost', label: 'Perdido', description: 'Etapa de insucesso' },
  { value: 'archived', label: 'Arquivado', description: 'Etapa arquivada' }
];

const USER_ROLES = [
  'administrator', 'sdr', 'closer', 'partnership_director', 'support'
];

export function FlowBuilder({ onFlowCreated, initialTemplate, flowId }: FlowBuilderProps) {
  const { user } = useAuth();
  const { currentClient } = useClientStore();
  const {
    templates,
    isLoading,
    error,
    loadTemplates,
    createFlowFromTemplate,
    createCustomFlow,
    saveAsTemplate
  } = useFlowBuilder();

  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [stages, setStages] = useState<FlowStage[]>([]);
  const [automations, setAutomations] = useState<FlowAutomation[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate || '');
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<FlowStage | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<FlowAutomation | null>(null);

  // =====================================================
  // CARREGAR TEMPLATES AO INICIALIZAR
  // =====================================================
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // =====================================================
  // CARREGAR FLOW EXISTENTE PARA EDIÇÃO
  // =====================================================
  useEffect(() => {
    if (flowId) {
      loadExistingFlow(flowId);
    }
  }, [flowId]);

  const loadExistingFlow = async (id: string) => {
    try {
      // Carregar dados do flow
      const { data: flowData, error: flowError } = await supabase
        .from('web_flows')
        .select('*')
        .eq('id', id)
        .single();

      if (flowError) throw flowError;

      // Carregar stages do flow
      const { data: stagesData, error: stagesError } = await supabase
        .from('web_flow_stages')
        .select('*')
        .eq('flow_id', id)
        .order('order_index');

      if (stagesError) throw stagesError;

      // Carregar automações do flow
      const { data: automationsData, error: automationsError } = await supabase
        .from('web_flow_automations')
        .select('*')
        .eq('source_flow_id', id);

      if (automationsError) throw automationsError;

      // Mapear stages do banco para formato do form (stage_type, is_final_stage podem não existir no DB)
      const stagesList = (stagesData || []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        color: row.color ?? STAGE_COLORS[0],
        order_index: row.order_index,
        stage_type: ((row as { stage_type?: string }).stage_type as FlowStage['stage_type']) ?? 'active',
        is_final_stage: (row as { is_final_stage?: boolean }).is_final_stage ?? false
      })) as FlowStage[];

      // Mapear automações do banco para formato do form (source_stage, automation_type, trigger_condition)
      const mappedAutomations: FlowAutomation[] = (automationsData || []).map((row) => {
        const sourceStageName = stagesList.find((s) => s.id === row.source_stage_id)?.name ?? '';
        const automationType = (row.action_type as 'duplicate' | 'move' | 'notify') || 'duplicate';
        const triggerCond = (row.trigger_event as 'stage_change' | 'time_based' | 'field_change') || 'stage_change';
        return {
          name: row.name,
          description: row.description ?? '',
          source_stage: sourceStageName,
          automation_type: automationType,
          trigger_condition: triggerCond,
          target_flow_name: undefined,
          visible_to_roles: row.visible_to_roles ?? []
        };
      });

      // Atualizar estados com dados carregados
      setFlowName(flowData.name || '');
      setFlowDescription(flowData.description || '');
      setStages(stagesList);
      setAutomations(mappedAutomations);
    } catch (error) {
      console.error('Erro ao carregar flow:', error);
      alert('Erro ao carregar dados do flow');
    }
  };

  // =====================================================
  // APLICAR TEMPLATE SELECIONADO
  // =====================================================
  const applyTemplate = async () => {
    if (!selectedTemplate) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const templateData = template.template_data as any;
    
    setFlowName(templateData.flow.name);
    setFlowDescription(templateData.flow.description);
    setStages(templateData.stages || []);
    setAutomations(templateData.automations || []);
  };

  // =====================================================
  // ADICIONAR NOVA STAGE
  // =====================================================
  const addStage = () => {
    const newStage: FlowStage = {
      name: '',
      description: '',
      color: STAGE_COLORS[stages.length % STAGE_COLORS.length],
      order_index: stages.length + 1,
      stage_type: 'active',
      is_final_stage: false
    };
    setEditingStage(newStage);
    setShowStageDialog(true);
  };

  // =====================================================
  // SALVAR STAGE
  // =====================================================
  const saveStage = (stageData: FlowStage) => {
    if (editingStage?.id) {
      // Editando stage existente
      setStages(prev => prev.map(s => 
        s.id === editingStage.id ? { ...stageData, id: editingStage.id } : s
      ));
    } else {
      // Nova stage
      setStages(prev => [...prev, { ...stageData, id: `temp-${Date.now()}` }]);
    }
    setShowStageDialog(false);
    setEditingStage(null);
  };

  // =====================================================
  // REMOVER STAGE
  // =====================================================
  const removeStage = (stageId: string) => {
    setStages(prev => prev.filter(s => s.id !== stageId));
    // Remover automações relacionadas
    setAutomations(prev => prev.filter(a => a.source_stage !== stageId));
  };

  // =====================================================
  // ADICIONAR AUTOMAÇÃO
  // =====================================================
  const addAutomation = () => {
    const newAutomation: FlowAutomation = {
      name: '',
      description: '',
      source_stage: '',
      automation_type: 'duplicate',
      trigger_condition: 'stage_change',
      visible_to_roles: []
    };
    setEditingAutomation(newAutomation);
    setShowAutomationDialog(true);
  };

  // =====================================================
  // SALVAR AUTOMAÇÃO
  // =====================================================
  const saveAutomation = (automationData: FlowAutomation) => {
    if (editingAutomation && automations.some(a => a.name === editingAutomation.name)) {
      // Editando automação existente
      setAutomations(prev => prev.map(a => 
        a.name === editingAutomation.name ? automationData : a
      ));
    } else {
      // Nova automação
      setAutomations(prev => [...prev, automationData]);
    }
    setShowAutomationDialog(false);
    setEditingAutomation(null);
  };

  // =====================================================
  // CRIAR FLOW
  // =====================================================
  const createFlow = async () => {
    if (!flowName.trim() || stages.length === 0) {
      alert('Nome do flow e pelo menos uma etapa são obrigatórios');
      return;
    }

    if (flowId) {
      // Modo edição - atualizar flow existente
      await updateExistingFlow();
    } else {
      // Modo criação - criar novo flow
      const flowData = {
        name: flowName,
        description: flowDescription,
        stages: stages.map(({ id, ...stage }) => stage),
        automations
      };

      const newFlow = await createCustomFlow(flowData);
      if (newFlow && onFlowCreated) {
        onFlowCreated(newFlow);
      }
    }
  };

  const updateExistingFlow = async () => {
    try {
      // Atualizar dados básicos do flow
      const { error: flowError } = await supabase
        .from('web_flows')
        .update({
          name: flowName,
          description: flowDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (flowError) throw flowError;

      // Remover stages existentes
      const { error: deleteStagesError } = await supabase
        .from('web_flow_stages')
        .delete()
        .eq('flow_id', flowId);

      if (deleteStagesError) throw deleteStagesError;

      // Inserir stages atualizados (apenas campos do schema: client_id, flow_id, name, description, color, order_index)
      let newStages: { id: string; name: string }[] = [];
      if (stages.length > 0 && currentClient?.id) {
        const stagesData = stages.map(({ id, ...stage }) => ({
          flow_id: flowId,
          client_id: currentClient.id,
          name: stage.name,
          description: stage.description ?? null,
          color: stage.color ?? null,
          order_index: stage.order_index
        }));

        const { data: insertedStages, error: insertStagesError } = await supabase
          .from('web_flow_stages')
          .insert(stagesData)
          .select('id, name');

        if (insertStagesError) throw insertStagesError;
        newStages = insertedStages ?? [];
      }

      // Remover automações existentes
      const { error: deleteAutomationsError } = await supabase
        .from('web_flow_automations')
        .delete()
        .eq('source_flow_id', flowId);

      if (deleteAutomationsError) throw deleteAutomationsError;

      // Inserir automações atualizadas (mapear form -> schema do banco: action_type, trigger_event, source_stage_id, etc.)
      if (automations.length > 0 && currentClient?.id && user?.id && newStages.length > 0) {
        const automationsData = automations.map((automation) => {
          const sourceStage = newStages.find((s) => s.name === automation.source_stage) ?? newStages[0];
          return {
            source_flow_id: flowId,
            source_stage_id: sourceStage.id,
            target_flow_id: flowId,
            target_stage_id: sourceStage.id,
            client_id: currentClient.id,
            created_by: user.id,
            name: automation.name,
            description: automation.description ?? null,
            action_type: automation.automation_type ?? 'duplicate',
            trigger_event: automation.trigger_condition ?? 'stage_change',
            visible_to_roles: automation.visible_to_roles ?? []
          };
        });

        const { error: insertAutomationsError } = await supabase
          .from('web_flow_automations')
          .insert(automationsData);

        if (insertAutomationsError) throw insertAutomationsError;
      }

      alert('Flow atualizado com sucesso!');
      if (onFlowCreated) {
        onFlowCreated({ id: flowId, name: flowName });
      }
    } catch (error) {
      console.error('Erro ao atualizar flow:', error);
      alert('Erro ao atualizar flow');
    }
  };

  // =====================================================
  // SALVAR COMO TEMPLATE
  // =====================================================
  const saveAsNewTemplate = async () => {
    if (!flowName.trim()) {
      alert('Nome do flow é obrigatório para salvar como template');
      return;
    }

    const templateName = prompt('Nome do template:');
    if (!templateName) return;

    const templateDescription = prompt('Descrição do template:') || '';
    const category = prompt('Categoria (vendas, onboarding, suporte, projetos, custom):') || 'custom';

    // Criar flow temporário para salvar como template
    const tempFlow = await createCustomFlow({
      name: flowName,
      description: flowDescription,
      stages: stages.map(({ id, ...stage }) => stage),
      automations
    });

    if (tempFlow) {
      await saveAsTemplate(tempFlow.id, templateName, templateDescription, category);
      alert('Template salvo com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Construtor de Flows</h2>
        <div className="flex gap-2">
          <Button onClick={saveAsNewTemplate} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Salvar como Template
          </Button>
          <Button onClick={createFlow} disabled={isLoading}>
            {flowId ? 'Atualizar Flow' : 'Criar Flow'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Começar com Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applyTemplate} disabled={!selectedTemplate}>
            Aplicar Template
          </Button>
        </CardContent>
      </Card>

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
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Ex: Vendas Completo"
            />
          </div>
          <div>
            <Label htmlFor="flowDescription">Descrição</Label>
            <Textarea
              id="flowDescription"
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
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
            <Button onClick={addStage} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Etapa
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="border rounded-lg p-4 space-y-2"
                style={{ borderColor: stage.color }}
              >
                <div className="flex items-center justify-between">
                  <Badge 
                    style={{ backgroundColor: stage.color, color: 'white' }}
                  >
                    {stage.order_index}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingStage(stage);
                        setShowStageDialog(true);
                      }}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStage(stage.id!)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <h4 className="font-medium">{stage.name}</h4>
                <p className="text-sm text-gray-600">{stage.description}</p>
                <div className="flex gap-1">
                  <Badge variant="outline">{stage.stage_type}</Badge>
                  {stage.is_final_stage && (
                    <Badge variant="secondary">Final</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Automações
            <Button onClick={addAutomation} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Automação
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automations.map((automation, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{automation.name}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingAutomation(automation);
                      setShowAutomationDialog(true);
                    }}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{automation.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{automation.source_stage}</Badge>
                  <ArrowRight className="w-3 h-3" />
                  <Badge variant="outline">{automation.automation_type}</Badge>
                  {automation.target_flow_name && (
                    <>
                      <ArrowRight className="w-3 h-3" />
                      <Badge variant="outline">{automation.target_flow_name}</Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Dialog */}
      <StageDialog
        open={showStageDialog}
        onOpenChange={setShowStageDialog}
        stage={editingStage}
        onSave={saveStage}
      />

      {/* Automation Dialog */}
      <AutomationDialog
        open={showAutomationDialog}
        onOpenChange={setShowAutomationDialog}
        automation={editingAutomation}
        stages={stages}
        onSave={saveAutomation}
      />
    </div>
  );
}

// =====================================================
// DIALOG PARA EDIÇÃO DE STAGE
// =====================================================
interface StageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: FlowStage | null;
  onSave: (stage: FlowStage) => void;
}

function StageDialog({ open, onOpenChange, stage, onSave }: StageDialogProps) {
  const [formData, setFormData] = useState<FlowStage>({
    name: '',
    description: '',
    color: STAGE_COLORS[0],
    order_index: 1,
    stage_type: 'active',
    is_final_stage: false
  });

  useEffect(() => {
    if (stage) {
      setFormData(stage);
    }
  }, [stage]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Nome da etapa é obrigatório');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {stage?.id ? 'Editar Etapa' : 'Nova Etapa'}
          </DialogTitle>
          <DialogDescription>
            {stage?.id
              ? 'Edite as informações da etapa do fluxo'
              : 'Crie uma nova etapa para o fluxo'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="stageName">Nome da Etapa</Label>
            <Input
              id="stageName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Qualificação"
            />
          </div>
          <div>
            <Label htmlFor="stageDescription">Descrição</Label>
            <Textarea
              id="stageDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva esta etapa"
            />
          </div>
          <div>
            <Label htmlFor="stageColor">Cor</Label>
            <div className="flex gap-2 mt-2">
              {STAGE_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="stageType">Tipo da Etapa</Label>
            <Select 
              value={formData.stage_type} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, stage_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFinalStage"
              checked={formData.is_final_stage}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_final_stage: !!checked }))
              }
            />
            <Label htmlFor="isFinalStage">Etapa final</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// DIALOG PARA EDIÇÃO DE AUTOMAÇÃO
// =====================================================
interface AutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: FlowAutomation | null;
  stages: FlowStage[];
  onSave: (automation: FlowAutomation) => void;
}

function AutomationDialog({ open, onOpenChange, automation, stages, onSave }: AutomationDialogProps) {
  const [formData, setFormData] = useState<FlowAutomation>({
    name: '',
    description: '',
    source_stage: '',
    automation_type: 'duplicate',
    trigger_condition: 'stage_change',
    visible_to_roles: []
  });

  useEffect(() => {
    if (automation) {
      setFormData(automation);
    }
  }, [automation]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.source_stage) {
      alert('Nome e etapa de origem são obrigatórios');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {automation ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
          <DialogDescription>
            {automation
              ? 'Edite as configurações da automação'
              : 'Configure uma nova automação para o fluxo'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="automationName">Nome da Automação</Label>
            <Input
              id="automationName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Duplicar para Closer"
            />
          </div>
          <div>
            <Label htmlFor="automationDescription">Descrição</Label>
            <Textarea
              id="automationDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o que esta automação faz"
            />
          </div>
          <div>
            <Label htmlFor="sourceStage">Etapa de Origem</Label>
            <Select 
              value={formData.source_stage} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, source_stage: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.name}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="automationType">Tipo de Automação</Label>
            <Select 
              value={formData.automation_type} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, automation_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duplicate">Duplicar</SelectItem>
                <SelectItem value="move">Mover</SelectItem>
                <SelectItem value="notify">Notificar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="targetFlow">Flow de Destino (opcional)</Label>
            <Input
              id="targetFlow"
              value={formData.target_flow_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, target_flow_name: e.target.value }))}
              placeholder="Nome do flow de destino"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}