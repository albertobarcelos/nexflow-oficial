// =====================================================
// COMPONENTE PARA VISUALIZAÇÕES DUPLICADAS DE DEALS
// =====================================================
// AIDEV-NOTE: Interface para gerenciar visualizações múltiplas de deals
// Mostra deals duplicados entre flows com sincronização automática

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, RefreshCw, Trash2, Plus, Filter } from 'lucide-react';
import { useFlowViews } from '@/hooks/useFlowViews';
import { useAuth } from '@/hooks/useAuth';
import { useClientStore } from '@/stores/clientStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FlowViewsProps {
  /** Quando ausente, a página exibe estado vazio (ex.: FlowViewsPage sem deal em contexto). */
  dealId?: string;
  onStageChange?: (dealId: string, flowId: string, stageId: string) => void;
}

interface FlowViewCardProps {
  view: any;
  userRole: string;
  onStageChange: (stageId: string) => void;
  onRemove: () => void;
  onSync: () => void;
}

export function FlowViews({ dealId, onStageChange }: FlowViewsProps) {
  const { user } = useAuth();
  const clientId = useClientStore((s) => s.currentClient?.id) ?? null;
  const {
    dealViews,
    isLoading,
    error,
    loadDealViews,
    moveDealToStage,
    syncDealViews,
    getVisibleViews,
    removeDealView
  } = useFlowViews();

  const [selectedRole, setSelectedRole] = useState(user?.role || 'administrator');
  const [showAddViewDialog, setShowAddViewDialog] = useState(false);
  const [availableFlows, setAvailableFlows] = useState<any[]>([]);
  const [selectedFlow, setSelectedFlow] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [flowStages, setFlowStages] = useState<any[]>([]);

  // =====================================================
  // CARREGAR DADOS AO INICIALIZAR
  // =====================================================
  useEffect(() => {
    if (dealId) {
      loadDealViews(dealId);
      loadAvailableFlows();
    }
  }, [dealId, loadDealViews]);

  // =====================================================
  // CARREGAR FLOWS DISPONÍVEIS
  // =====================================================
  const loadAvailableFlows = async () => {
    if (!clientId) return;

    try {
      const { data, error } = await supabase
        .from('web_flows')
        .select(`
          id,
          name,
          description,
          stages:web_flow_stages(*)
        `)
        .eq('client_id', clientId)
        .order('name');

      if (error) throw error;
      setAvailableFlows(data || []);
    } catch (error) {
      console.error('Erro ao carregar flows:', error);
    }
  };

  // =====================================================
  // CARREGAR STAGES DO FLOW SELECIONADO
  // =====================================================
  useEffect(() => {
    if (selectedFlow) {
      const flow = availableFlows.find(f => f.id === selectedFlow);
      setFlowStages(flow?.stages || []);
      setSelectedStage('');
    }
  }, [selectedFlow, availableFlows]);

  // =====================================================
  // FILTRAR VISUALIZAÇÕES POR PAPEL
  // =====================================================
  const visibleViews = getVisibleViews(selectedRole);

  // =====================================================
  // MOVER DEAL PARA NOVA STAGE
  // =====================================================
  const handleStageChange = async (flowId: string, newStageId: string) => {
    const updatedView = await moveDealToStage(dealId, flowId, newStageId);
    if (updatedView && onStageChange) {
      onStageChange(dealId, flowId, newStageId);
    }
  };

  // =====================================================
  // SINCRONIZAR DADOS
  // =====================================================
  const handleSync = async () => {
    await syncDealViews(dealId, {
      last_manual_sync: new Date().toISOString(),
      sync_triggered_by: user?.id
    });
  };

  // =====================================================
  // ADICIONAR NOVA VISUALIZAÇÃO
  // =====================================================
  const addNewView = async () => {
    if (!selectedFlow || !selectedStage) {
      alert('Selecione um flow e uma etapa');
      return;
    }
    if (!dealId || !clientId) {
      alert('Cliente ou deal não definido.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('web_deal_flow_views')
        .insert({
          client_id: clientId,
          deal_id: dealId,
          flow_id: selectedFlow,
          stage_id: selectedStage,
          visible_to_roles: [selectedRole],
          is_primary: false,
        })
        .select(`
          *,
          flow:web_flows(*),
          stage:web_flow_stages(*)
        `)
        .single();

      if (error) throw error;

      // Recarregar visualizações
      loadDealViews(dealId);
      setShowAddViewDialog(false);
      setSelectedFlow('');
      setSelectedStage('');
    } catch (error) {
      console.error('Erro ao adicionar visualização:', error);
      alert('Erro ao adicionar visualização');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Visualizações do Deal</h3>
          <p className="text-sm text-gray-600">
            Este deal está presente em {visibleViews.length} flow(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro por Papel */}
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="administrator">Administrador</SelectItem>
              <SelectItem value="sdr">SDR</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
              <SelectItem value="partnership_director">Diretor</SelectItem>
              <SelectItem value="support">Suporte</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSync} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar
          </Button>

          <Dialog open={showAddViewDialog} onOpenChange={setShowAddViewDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Flow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Visualização</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="flowSelect">Selecionar Flow</Label>
                  <Select value={selectedFlow} onValueChange={setSelectedFlow}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um flow" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFlows.map(flow => (
                        <SelectItem key={flow.id} value={flow.id}>
                          {flow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedFlow && (
                  <div>
                    <Label htmlFor="stageSelect">Selecionar Etapa</Label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {flowStages.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddViewDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={addNewView}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Visualizações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleViews.map(view => (
          <FlowViewCard
            key={`${view.flow_id}-${view.deal_id}`}
            view={view}
            userRole={selectedRole}
            onStageChange={(stageId) => handleStageChange(view.flow_id, stageId)}
            onRemove={() => removeDealView(dealId, view.flow_id)}
            onSync={handleSync}
          />
        ))}
      </div>

      {visibleViews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Eye className="w-12 h-12 mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma visualização encontrada
          </h4>
          <p className="text-gray-600 mb-4">
            Este deal ainda não foi adicionado a nenhum flow ou você não tem permissão para visualizar.
          </p>
          <Button onClick={() => setShowAddViewDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar ao Flow
          </Button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// CARD DE VISUALIZAÇÃO INDIVIDUAL
// =====================================================
function FlowViewCard({ view, userRole, onStageChange, onRemove, onSync }: FlowViewCardProps) {
  const [selectedStageId, setSelectedStageId] = useState(view.stage_id);
  const [isChangingStage, setIsChangingStage] = useState(false);

  const handleStageChange = async (newStageId: string) => {
    if (newStageId === selectedStageId) return;
    
    setIsChangingStage(true);
    try {
      await onStageChange(newStageId);
      setSelectedStageId(newStageId);
    } catch (error) {
      console.error('Erro ao mover deal:', error);
    } finally {
      setIsChangingStage(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{view.flow?.name}</CardTitle>
          <div className="flex items-center gap-1">
            {view.is_primary && (
              <Badge variant="default" className="text-xs">
                Principal
              </Badge>
            )}
            {view.sync_data?.created_by_automation && (
              <Badge variant="secondary" className="text-xs">
                Auto
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">{view.flow?.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Etapa Atual */}
        <div>
          <Label className="text-xs font-medium text-gray-500">ETAPA ATUAL</Label>
          <div className="mt-1">
            <Badge 
              style={{ 
                backgroundColor: view.stage?.color || '#6B7280',
                color: 'white'
              }}
              className="text-sm"
            >
              {view.stage?.name}
            </Badge>
          </div>
        </div>

        {/* Seletor de Nova Etapa */}
        <div>
          <Label className="text-xs font-medium text-gray-500">MOVER PARA</Label>
          <Select 
            value={selectedStageId} 
            onValueChange={handleStageChange}
            disabled={isChangingStage}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {view.flow?.stages?.map((stage: any) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Informações de Sincronização */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Última sincronização:</span>
            <span className="font-medium">
              {view.last_sync_at ? formatDate(view.last_sync_at) : 'Nunca'}
            </span>
          </div>
          
          {view.visible_to_roles && view.visible_to_roles.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Visível para:</span>
              <div className="flex gap-1">
                {view.visible_to_roles.slice(0, 2).map((role: string) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
                {view.visible_to_roles.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{view.visible_to_roles.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSync}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Sincronizar
          </Button>
          
          {!view.is_primary && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRemove}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remover
            </Button>
          )}
        </div>
      </CardContent>

      {/* Indicador de Carregamento */}
      {isChangingStage && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </Card>
  );
}