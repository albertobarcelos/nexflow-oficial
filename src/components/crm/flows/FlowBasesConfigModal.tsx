import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Settings,
  Search,
  Eye,
  EyeOff,
  Star,
  ArrowUp,
  ArrowDown,
  Info
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowBases, DatabaseBase, FlowBase } from '@/hooks/useFlowBases';
import { toast } from 'sonner';
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

interface FlowBasesConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

// Componente Sortable para cada entidade
function SortableEntityItem({ 
  flowEntity, 
  showAdvanced, 
  isUpdating, 
  isUnlinking,
  onToggleRequired, 
  onTogglePrimary, 
  onUnlink 
}: {
  flowEntity: FlowBase;
  showAdvanced: boolean;
  isUpdating: boolean;
  isUnlinking: boolean;
  onToggleRequired: (flowEntity: FlowBase) => void;
  onTogglePrimary: (flowEntity: FlowBase) => void;
  onUnlink: (linkId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flowEntity.link_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

  const getEntityColor = (entityName: string) => {
    const name = entityName.toLowerCase();
    if (name.includes('empresa') || name.includes('company')) return '#3b82f6';
    if (name.includes('pessoa') || name.includes('contact') || name.includes('person')) return '#10b981';
    if (name.includes('parceiro') || name.includes('partner')) return '#f59e0b';
    if (name.includes('curso') || name.includes('course')) return '#8b5cf6';
    if (name.includes('imóvel') || name.includes('imovel') || name.includes('property')) return '#ef4444';
    return '#6b7280';
  };

  const Icon = getEntityIcon(flowEntity.entity_name || '');
  const color = getEntityColor(flowEntity.entity_name || '');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg transition-all ${
        isDragging 
          ? 'border-blue-300 shadow-lg bg-blue-50 opacity-50' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        
        <Icon 
          className="w-5 h-5" 
          style={{ color }}
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{flowEntity.entity_name}</span>
            {flowEntity.is_primary && (
              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                <Star className="w-3 h-3 mr-1" />
                Principal
              </Badge>
            )}
            {flowEntity.is_required && (
              <Badge variant="destructive" className="text-xs">
                Obrigatório
              </Badge>
            )}
          </div>
          {flowEntity.entity_description && (
            <p className="text-xs text-gray-500">
              {flowEntity.entity_description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showAdvanced && (
            <>
              {/* Toggle Obrigatório */}
              <div className="flex items-center gap-1">
                <Label className="text-xs text-gray-600">Obrigatório</Label>
                <Switch
                  checked={flowEntity.is_required}
                  onCheckedChange={() => onToggleRequired(flowEntity)}
                  disabled={isUpdating}
                  size="sm"
                />
              </div>

              {/* Toggle Principal */}
              <div className="flex items-center gap-1">
                <Label className="text-xs text-gray-600">Principal</Label>
                <Switch
                  checked={flowEntity.is_primary}
                  onCheckedChange={() => onTogglePrimary(flowEntity)}
                  disabled={isUpdating}
                  size="sm"
                />
              </div>
            </>
          )}

          {/* Botão remover */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnlink(flowEntity.link_id)}
            disabled={isUnlinking}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FlowBasesConfigModal({ 
  open, 
  onOpenChange, 
  flowId, 
  flowName 
}: FlowBasesConfigModalProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const {
    availableBases: availableEntities,
    linkedBases: linkedEntities,
    isLoading,
    linkBase: linkEntity,
    unlinkBase: unlinkEntity,
    updateBaseConfig: updateEntityConfig,
    reorderBases: reorderEntities,
    isLinking,
    isUnlinking,
    isUpdating,
    isReordering,
  } = useFlowBases(flowId);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar entidades disponíveis por termo de busca
  const filteredAvailableEntities = useMemo(() => {
    return availableEntities.filter(entity => 
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entity.description && entity.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [availableEntities, searchTerm]);

  // Entidades disponíveis que ainda não estão vinculadas
  const unlinkedEntities = filteredAvailableEntities.filter(
    entity => !linkedEntities.some(linked => linked.entity_id === entity.id)
  );

  // Entidades vinculadas ordenadas
  const sortedLinkedEntities = useMemo(() => {
    return [...linkedEntities].sort((a, b) => a.order_index - b.order_index);
  }, [linkedEntities]);

  const handleLinkEntity = () => {
    if (!selectedEntityId) return;
    
    linkEntity({
      entityId: selectedEntityId,
      isRequired: false,
    });
    
    setSelectedEntityId('');
  };

  const handleUnlinkEntity = (linkId: string) => {
    unlinkEntity(linkId);
  };

  const handleToggleRequired = (flowEntity: FlowBase) => {
    updateEntityConfig({
      linkId: flowEntity.link_id,
      isRequired: !flowEntity.is_required,
    });
  };

  const handleTogglePrimary = (flowEntity: FlowBase) => {
    // Remover primary de outras entidades primeiro
    linkedEntities.forEach(entity => {
      if (entity.link_id !== flowEntity.link_id && entity.is_primary) {
        updateEntityConfig({
          linkId: entity.link_id,
          isPrimary: false,
        });
      }
    });

    // Atualizar a entidade atual
    updateEntityConfig({
      linkId: flowEntity.link_id,
      isPrimary: !flowEntity.is_primary,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedLinkedEntities.findIndex(entity => entity.link_id === active.id);
    const newIndex = sortedLinkedEntities.findIndex(entity => entity.link_id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedLinkedEntities, oldIndex, newIndex);
      
      // Criar array de reordenação
      const reorderData = newOrder.map((entity, index) => ({
        entityId: entity.entity_id,
        orderIndex: index + 1,
      }));

      reorderEntities(reorderData);
    }
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

  const getEntityColor = (entityName: string) => {
    const name = entityName.toLowerCase();
    if (name.includes('empresa') || name.includes('company')) return '#3b82f6';
    if (name.includes('pessoa') || name.includes('contact') || name.includes('person')) return '#10b981';
    if (name.includes('parceiro') || name.includes('partner')) return '#f59e0b';
    if (name.includes('curso') || name.includes('course')) return '#8b5cf6';
    if (name.includes('imóvel') || name.includes('imovel') || name.includes('property')) return '#ef4444';
    return '#6b7280';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Link className="w-5 h-5" />
            Configurar Entidades do Flow
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Configure quais entidades (bases de dados) estarão disponíveis em "<span className="font-medium">{flowName}</span>"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Painel Esquerdo - Entidades Disponíveis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Entidades Disponíveis</h3>
              <Badge variant="outline" className="text-xs">
                {unlinkedEntities.length} disponíveis
              </Badge>
            </div>

            {/* Barra de pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar entidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Adicionar nova entidade */}
            <div className="space-y-3 p-4 border border-dashed border-gray-300 rounded-lg">
              <Label className="text-sm font-medium">Vincular Entidade</Label>
              <div className="flex gap-2">
                <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedEntities.length === 0 ? (
                      <div className="p-3 text-center text-sm text-gray-500">
                        {searchTerm ? 'Nenhuma entidade encontrada' : 'Todas as entidades já estão vinculadas'}
                      </div>
                    ) : (
                      unlinkedEntities.map((entity) => {
                        const Icon = getEntityIcon(entity.name);
                        const color = getEntityColor(entity.name);
                        return (
                          <SelectItem key={entity.id} value={entity.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" style={{ color }} />
                              <span>{entity.name}</span>
                              {entity.description && (
                                <span className="text-xs text-gray-500">• {entity.description}</span>
                              )}
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
                      <Plus className="w-4 h-4 mr-2" />
                      Vincular
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Lista de entidades disponíveis */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredAvailableEntities.map((entity) => {
                const Icon = getEntityIcon(entity.name);
                const color = getEntityColor(entity.name);
                const isLinked = linkedEntities.some(linked => linked.entity_id === entity.id);
                
                return (
                  <div
                    key={entity.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isLinked 
                        ? 'border-green-200 bg-green-50 opacity-60' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                    }`}
                    onClick={() => !isLinked && setSelectedEntityId(entity.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" style={{ color }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entity.name}</span>
                          {isLinked && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Vinculada
                            </Badge>
                          )}
                        </div>
                        {entity.description && (
                          <p className="text-xs text-gray-500 mt-1">{entity.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel Direito - Entidades Vinculadas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Entidades Vinculadas</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {linkedEntities.length} vinculadas
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvanced ? 'Ocultar' : 'Avançado'}
                </Button>
              </div>
            </div>
            
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedLinkedEntities.map(entity => entity.link_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {sortedLinkedEntities.map((flowEntity) => (
                      <SortableEntityItem
                        key={flowEntity.link_id}
                        flowEntity={flowEntity}
                        showAdvanced={showAdvanced}
                        isUpdating={isUpdating}
                        isUnlinking={isUnlinking}
                        onToggleRequired={handleToggleRequired}
                        onTogglePrimary={handleTogglePrimary}
                        onUnlink={handleUnlinkEntity}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Informações sobre as configurações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800">
                Como funcionam as entidades
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Entidade Principal:</strong> Aparece como campo prioritário no formulário</p>
                <p>• <strong>Obrigatório:</strong> Deve ser preenchido para criar um deal</p>
                <p>• <strong>Navegação:</strong> Entidades vinculadas aparecem no sidebar do flow</p>
                <p>• <strong>Ordem:</strong> Arraste e solte para reordenar as entidades</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações do modal */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {linkedEntities.length > 0 && (
              <>
                {linkedEntities.filter(e => e.is_required).length} obrigatórias • 
                {linkedEntities.filter(e => e.is_primary).length} principal
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                toast.success('Configurações de entidades salvas!');
                onOpenChange(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 