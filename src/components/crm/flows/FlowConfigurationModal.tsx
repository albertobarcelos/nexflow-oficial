// =====================================================
// MODAL DE CONFIGURAÇÃO COMPLETA DE FLOWS
// =====================================================
// AIDEV-NOTE: Modal centralizado para todas as configurações de flow
// Inclui abas para diferentes aspectos: geral, campos, automações, etc.

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FormBuilderModal } from './FormBuilderModal';
import { ActivityTypesTab } from './ActivityTypesTab';
import { 
  Settings, 
  FormInput, 
  Zap, 
  Users, 
  BarChart, 
  Palette,
  Calendar,
  Save,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FlowConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

interface FlowData {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface FlowStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  stage_type: 'active' | 'won' | 'lost' | 'archived';
  is_final_stage: boolean;
}

interface FlowAutomation {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  source_flow_id: string;
  source_stage_id: string;
  target_flow_id: string;
  target_stage_id: string;
  automation_type: 'duplicate' | 'move' | 'copy';
  created_at: string;
  updated_at: string;
}

export function FlowConfigurationModal({ 
  open, 
  onOpenChange, 
  flowId, 
  flowName 
}: FlowConfigurationModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para dados do flow
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [stages, setStages] = useState<FlowStage[]>([]);
  const [automations, setAutomations] = useState<FlowAutomation[]>([]);
  
  // Estados para formulários
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  
  // Estados para modais
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  // =====================================================
  // CARREGAR DADOS DO FLOW
  // =====================================================
  useEffect(() => {
    if (open && flowId) {
      loadFlowData();
    }
  }, [open, flowId]);

  const loadFlowData = async () => {
    setIsLoading(true);
    try {
      // Carregar dados básicos do flow
      const { data: flow, error: flowError } = await supabase
        .from('web_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (flowError) throw flowError;

      setFlowData(flow as unknown as FlowData);
      setFormData({
        name: flow.name || '',
        description: flow.description || '',
        is_active: (flow as any).is_active ?? true
      });

      // Carregar stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('web_flow_stages')
        .select('*')
        .eq('flow_id', flowId)
        .order('order_index');

      if (stagesError) throw stagesError;
      setStages(stagesData || []);

      // Carregar automações
      const { data: automationsData, error: automationsError } = await supabase
        .from('web_flow_automations')
        .select('*')
        .eq('source_flow_id', flowId);

      if (automationsError) throw automationsError;
      setAutomations(automationsData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do flow:', error);
      toast.error('Erro ao carregar configurações do flow');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // SALVAR CONFIGURAÇÕES GERAIS
  // =====================================================
  const saveGeneralSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('web_flows')
        .update({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      await loadFlowData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================
  // TOGGLE ATIVAÇÃO DE AUTOMAÇÃO
  // =====================================================
  const toggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('web_flow_automations')
        .update({ is_active: isActive })
        .eq('id', automationId);

      if (error) throw error;

      setAutomations(prev => 
        prev.map(auto => 
          auto.id === automationId 
            ? { ...auto, is_active: isActive }
            : auto
        )
      );

      toast.success(`Automação ${isActive ? 'ativada' : 'desativada'}`);
    } catch (error) {
      console.error('Erro ao atualizar automação:', error);
      toast.error('Erro ao atualizar automação');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando configurações...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configurações do Flow: {flowName}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general" className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-1">
                <FormInput className="w-4 h-4" />
                Campos
              </TabsTrigger>
              <TabsTrigger value="activity-types" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Tipos de Atividade
              </TabsTrigger>
              <TabsTrigger value="automations" className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Automações
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Permissões
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1">
                <BarChart className="w-4 h-4" />
                Relatórios
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-1">
                <Palette className="w-4 h-4" />
                Aparência
              </TabsTrigger>
            </TabsList>

            {/* ABA GERAL */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Flow</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do flow"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="status"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="status">
                          {formData.is_active ? 'Ativo' : 'Inativo'}
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do flow"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveGeneralSettings} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Sistema */}
              {flowData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Sistema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-500">ID do Flow</Label>
                        <p className="font-mono">{flowData.id}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Criado em</Label>
                        <p>{new Date(flowData.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Última atualização</Label>
                        <p>{new Date(flowData.updated_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Total de Etapas</Label>
                        <p>{stages.length} etapas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ABA CAMPOS */}
            <TabsContent value="fields" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Campos Personalizados
                    <Button onClick={() => setShowFormBuilder(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Formulário
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Configure os campos do formulário que serão exibidos para este flow.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">
                      Use o botão "Editar Formulário" para acessar o construtor visual de campos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA TIPOS DE ATIVIDADE */}
            <TabsContent value="activity-types" className="space-y-6">
              <ActivityTypesTab flowId={flowId} />
            </TabsContent>

            {/* ABA AUTOMAÇÕES */}
            <TabsContent value="automations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Automações Configuradas
                    <Badge variant="outline">{automations.length} automações</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {automations.length === 0 ? (
                    <div className="text-center py-8">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nenhuma automação configurada</p>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeira Automação
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {automations.map((automation) => (
                        <div key={automation.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{automation.name}</h4>
                            <p className="text-sm text-gray-600">{automation.description}</p>
                            <Badge variant="secondary" className="mt-1">
                              {automation.automation_type}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={automation.is_active}
                              onCheckedChange={(checked) => toggleAutomation(automation.id, checked)}
                            />
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA PERMISSÕES */}
            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Acesso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Configure quem pode visualizar e editar este flow.
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        🚧 Funcionalidade em desenvolvimento
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA RELATÓRIOS */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Configure dashboards e métricas personalizadas para este flow.
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        🚧 Funcionalidade em desenvolvimento
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA APARÊNCIA */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personalização Visual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Personalize cores, layout e aparência do flow.
                    </p>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        🚧 Funcionalidade em desenvolvimento
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal do Form Builder */}
      <FormBuilderModal
        open={showFormBuilder}
        onOpenChange={setShowFormBuilder}
        flowId={flowId}
        flowName={flowName}
      />
    </>
  );
}