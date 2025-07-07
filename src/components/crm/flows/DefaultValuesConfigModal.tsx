import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  Settings, 
  User, 
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { useFlowStages } from '@/hooks/useFlowStages';
import { toast } from 'sonner';

interface DefaultValuesConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

interface DefaultFormConfig {
  // Responsável padrão
  defaultAssignee: 'current_user' | 'flow_owner' | 'specific_user' | null;
  specificUserId?: string;
  
  // Configurações de comportamento
  autoSaveDraft: boolean;
  notifyAssignee: boolean;
  requireConfirmation: boolean;
  
  // Fase inicial
  initialStageId?: string;
  
  // Valores padrão para campos
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority: 'low' | 'medium' | 'high';
  defaultStatus: 'new' | 'in_progress' | 'pending';
  
  // Configurações de formulário
  showProgressBar: boolean;
  allowPartialSave: boolean;
  enableRealTimeValidation: boolean;
}

export function DefaultValuesConfigModal({ 
  open, 
  onOpenChange, 
  flowId, 
  flowName 
}: DefaultValuesConfigModalProps) {
  const [config, setConfig] = useState<DefaultFormConfig>({
    defaultAssignee: 'current_user',
    autoSaveDraft: true,
    notifyAssignee: true,
    requireConfirmation: false,
    defaultPriority: 'medium',
    defaultStatus: 'new',
    showProgressBar: true,
    allowPartialSave: true,
    enableRealTimeValidation: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const { stages, isLoading: isLoadingStages } = useFlowStages(flowId);

  // Selecionar primeira fase como padrão
  useEffect(() => {
    if (stages.length > 0 && !config.initialStageId) {
      setConfig(prev => ({
        ...prev,
        initialStageId: stages[0].id
      }));
    }
  }, [stages, config.initialStageId]);

  const handleConfigChange = <K extends keyof DefaultFormConfig>(
    key: K,
    value: DefaultFormConfig[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Aqui você salvaria as configurações no banco de dados
      // Por enquanto, vamos simular um delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Configurações de dados padrão salvas!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-lg font-semibold">
              Dados Padrão do Formulário
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Configure valores padrão para "{flowName}"
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Responsável Padrão */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <Label className="text-sm font-medium">Responsável Padrão</Label>
            </div>
            
            <Select 
              value={config.defaultAssignee || ''} 
              onValueChange={(value) => handleConfigChange('defaultAssignee', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_user">Usuário que está criando</SelectItem>
                <SelectItem value="flow_owner">Dono do flow</SelectItem>
                <SelectItem value="specific_user">Usuário específico</SelectItem>
              </SelectContent>
            </Select>

            {config.defaultAssignee === 'specific_user' && (
              <Select 
                value={config.specificUserId || ''} 
                onValueChange={(value) => handleConfigChange('specificUserId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">João Silva</SelectItem>
                  <SelectItem value="user2">Maria Santos</SelectItem>
                  <SelectItem value="user3">Pedro Oliveira</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Fase Inicial */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Fase Inicial</Label>
            
            {isLoadingStages ? (
              <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Carregando fases...</span>
              </div>
            ) : (
              <Select 
                value={config.initialStageId || ''} 
                onValueChange={(value) => handleConfigChange('initialStageId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fase inicial" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} (Ordem {stage.order_index})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Valores Padrão */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Valores Padrão</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-priority" className="text-xs text-gray-600">
                  Prioridade
                </Label>
                <Select 
                  value={config.defaultPriority} 
                  onValueChange={(value) => handleConfigChange('defaultPriority', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-status" className="text-xs text-gray-600">
                  Status
                </Label>
                <Select 
                  value={config.defaultStatus} 
                  onValueChange={(value) => handleConfigChange('defaultStatus', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-title" className="text-xs text-gray-600">
                Prefixo do título (opcional)
              </Label>
              <Input
                id="default-title"
                value={config.defaultTitle || ''}
                onChange={(e) => handleConfigChange('defaultTitle', e.target.value)}
                placeholder="Ex: Novo Deal - "
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-description" className="text-xs text-gray-600">
                Descrição padrão (opcional)
              </Label>
              <Textarea
                id="default-description"
                value={config.defaultDescription || ''}
                onChange={(e) => handleConfigChange('defaultDescription', e.target.value)}
                placeholder="Descrição que aparecerá por padrão..."
                rows={3}
              />
            </div>
          </div>

          {/* Comportamento do Formulário */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Comportamento do Formulário</Label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Auto-salvar rascunho</Label>
                  <p className="text-xs text-gray-500">
                    Salva automaticamente conforme o usuário digita
                  </p>
                </div>
                <Switch
                  checked={config.autoSaveDraft}
                  onCheckedChange={(checked) => handleConfigChange('autoSaveDraft', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Notificar responsável</Label>
                  <p className="text-xs text-gray-500">
                    Enviar notificação quando um novo item for criado
                  </p>
                </div>
                <Switch
                  checked={config.notifyAssignee}
                  onCheckedChange={(checked) => handleConfigChange('notifyAssignee', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Exigir confirmação</Label>
                  <p className="text-xs text-gray-500">
                    Mostrar confirmação antes de criar o item
                  </p>
                </div>
                <Switch
                  checked={config.requireConfirmation}
                  onCheckedChange={(checked) => handleConfigChange('requireConfirmation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Mostrar barra de progresso</Label>
                  <p className="text-xs text-gray-500">
                    Exibir progresso de preenchimento do formulário
                  </p>
                </div>
                <Switch
                  checked={config.showProgressBar}
                  onCheckedChange={(checked) => handleConfigChange('showProgressBar', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Permitir salvamento parcial</Label>
                  <p className="text-xs text-gray-500">
                    Usuário pode salvar sem preencher campos obrigatórios
                  </p>
                </div>
                <Switch
                  checked={config.allowPartialSave}
                  onCheckedChange={(checked) => handleConfigChange('allowPartialSave', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Validação em tempo real</Label>
                  <p className="text-xs text-gray-500">
                    Validar campos conforme o usuário digita
                  </p>
                </div>
                <Switch
                  checked={config.enableRealTimeValidation}
                  onCheckedChange={(checked) => handleConfigChange('enableRealTimeValidation', checked)}
                />
              </div>
            </div>
          </div>

          {/* Informações */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-amber-800">
                  Sobre as configurações padrão
                </h4>
                <div className="text-xs text-amber-700 space-y-1">
                  <p>• Estas configurações se aplicam apenas ao <strong>formulário inicial</strong></p>
                  <p>• Campos específicos por fase têm suas próprias configurações</p>
                  <p>• Usuários podem sobrescrever valores padrão durante a criação</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações do modal */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 