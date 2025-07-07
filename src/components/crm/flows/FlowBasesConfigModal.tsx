import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  X, 
  Database, 
  Plus, 
  Trash2, 
  GripVertical,
  AlertCircle,
  Loader2,
  Link,
  Unlink,
  Building2,
  Users,
  Handshake,
  GraduationCap,
  Home,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowBases, FlowBase } from '@/hooks/useFlowBases';
import { toast } from 'sonner';

interface FlowBasesConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

export function FlowBasesConfigModal({ 
  open, 
  onOpenChange, 
  flowId, 
  flowName 
}: FlowBasesConfigModalProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  
  const {
    availableBases: availableEntities,
    linkedBases: linkedEntities,
    isLoading,
    linkBase: linkEntity,
    unlinkBase: unlinkEntity,
    updateBaseConfig: updateEntityConfig,
    isLinking,
    isUnlinking,
    isUpdating,
  } = useFlowBases(flowId);

  // Entidades disponíveis que ainda não estão vinculadas
  const unlinkedEntities = availableEntities.filter(
    entity => !linkedEntities.some(linked => linked.entity_id === entity.id)
  );

  const handleLinkEntity = () => {
    if (!selectedEntityId) return;
    
    linkEntity({
      entityId: selectedEntityId,
      isRequired: false,
    });
    
    setSelectedEntityId('');
  };

  const handleUnlinkEntity = (flowEntityId: string) => {
    unlinkEntity(flowEntityId);
  };

  const handleToggleRequired = (flowEntity: FlowBase) => {
    updateEntityConfig({
      flowEntityId: flowEntity.id,
      isRequired: !flowEntity.is_required,
    });
  };

  const handleTogglePrimary = (flowEntity: FlowBase) => {
    updateEntityConfig({
      flowEntityId: flowEntity.id,
      isPrimary: !flowEntity.is_primary,
    });
  };

  const getEntityIcon = (entityName: string) => {
    const name = entityName.toLowerCase();
    if (name.includes('empresa') || name.includes('company')) return Building2;
    if (name.includes('pessoa') || name.includes('contact') || name.includes('person')) return Users;
    if (name.includes('parceiro') || name.includes('partner')) return Handshake;
    if (name.includes('curso') || name.includes('course')) return GraduationCap;
    if (name.includes('imóvel') || name.includes('imovel') || name.includes('property')) return Home;
    return Database;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Link className="w-5 h-5" />
            Configurar Entidades do Flow
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Configure quais entidades (bases de dados) estarão disponíveis em "{flowName}"
          </p>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Adicionar nova entidade */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Adicionar Entidade</Label>
            <div className="flex gap-2">
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma entidade para vincular" />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedEntities.length === 0 ? (
                    <div className="p-3 text-center text-sm text-gray-500">
                      Todas as entidades disponíveis já estão vinculadas
                    </div>
                  ) : (
                    unlinkedEntities.map((entity) => {
                      const Icon = getEntityIcon(entity.name);
                      return (
                        <SelectItem key={entity.id} value={entity.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{entity.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleLinkEntity}
                disabled={!selectedEntityId || isLinking}
                className="min-w-[100px]"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Vincular
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Lista de entidades vinculadas */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Entidades Vinculadas ({linkedEntities.length})
            </Label>
            
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Carregando entidades...</p>
              </div>
            ) : linkedEntities.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">Nenhuma entidade vinculada</p>
                <p className="text-xs text-gray-400">
                  Vincule entidades para disponibilizá-las neste flow
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedEntities
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((flowEntity) => {
                    const Icon = getEntityIcon(flowEntity.entity?.name || '');
                    return (
                      <div
                        key={flowEntity.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon 
                            className="w-5 h-5" 
                            style={{ color: flowEntity.entity?.color || '#6b7280' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{flowEntity.entity?.name}</span>
                              {flowEntity.is_primary && (
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                  Principal
                                </Badge>
                              )}
                              {flowEntity.is_required && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                            {flowEntity.entity?.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {flowEntity.entity.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Obrigatório */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Obrigatório</Label>
                            <Switch
                              checked={flowEntity.is_required}
                              onCheckedChange={() => handleToggleRequired(flowEntity)}
                              disabled={isUpdating}
                            />
                          </div>

                          {/* Toggle Principal */}
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Principal</Label>
                            <Switch
                              checked={flowEntity.is_primary}
                              onCheckedChange={() => handleTogglePrimary(flowEntity)}
                              disabled={isUpdating}
                            />
                          </div>

                          {/* Botão remover */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkEntity(flowEntity.id)}
                            disabled={isUnlinking}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Informações sobre as configurações */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-800">
                  Como funcionam as entidades
                </h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• <strong>Entidade Principal:</strong> Aparece como campo prioritário no formulário</p>
                  <p>• <strong>Obrigatório:</strong> Deve ser preenchido para criar um deal</p>
                  <p>• <strong>Sidebar do Deal:</strong> Entidades vinculadas aparecem no lado esquerdo</p>
                  <p>• <strong>Ordem:</strong> Define a sequência de exibição nos formulários</p>
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
          >
            Fechar
          </Button>
          <Button
            onClick={() => {
              toast.success('Configurações de bases salvas!');
              onOpenChange(false);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 