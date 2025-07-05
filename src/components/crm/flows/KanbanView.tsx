import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Users, Activity, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { MockDeal, Stage, TemperatureTag, StageColors } from "./types";
import { KanbanDealCard } from "./KanbanDealCard";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
  DragStartEvent,
  DragOverEvent,
  rectIntersection,
  pointerWithin,
  getFirstCollision,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

interface KanbanViewProps {
    deals: MockDeal[];
    stages: Stage[];
    isMobile: boolean;
    onDragEnd: (event: DragEndEvent) => void;
    onDealClick: (deal: MockDeal) => void;
    onAddDeal: () => void;
    onAddDealToStage?: (stageId: string) => void;
    getTemperatureTag: (temperature?: string) => TemperatureTag;
    getStageColors: (index: number) => StageColors;
    tagColor: (tag: string) => string;
    // Propriedades de scroll infinito
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    // Contagens por stage
    stageDealsCount: Record<string, number>;
}

// Componente para um stage droppable otimizado
function DroppableStage({ 
  stage, 
  children, 
  className = "",
  isEmpty = false 
}: { 
  stage: Stage; 
  children: React.ReactNode; 
  className?: string;
  isEmpty?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} relative transition-all duration-200 ease-out ${
        isOver 
          ? 'bg-gradient-to-br from-blue-50/80 to-blue-100/80 border-2 border-blue-300 ring-2 ring-blue-200/40 shadow-md' 
          : isEmpty 
            ? 'border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors duration-150' 
            : 'border border-slate-200/60'
      }`}
    >
      {children}
      
      {/* Indicador visual de drop zone mais sutil */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-blue-500/5 rounded-xl">
          <div className="bg-blue-500/90 text-white px-3 py-1.5 rounded-md shadow-sm font-medium text-xs animate-pulse">
            Solte aqui
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para um deal draggable
function DraggableDeal({ 
  deal, 
  index, 
  onClick, 
  getTemperatureTag, 
  tagColor, 
  isMobile, 
  stageAccentColor 
}: {
  deal: MockDeal;
  index: number;
  onClick: (deal: MockDeal) => void;
  getTemperatureTag: (temperature?: string) => TemperatureTag;
  tagColor: (tag: string) => string;
  isMobile: boolean;
  stageAccentColor: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: deal.id,
    data: {
      type: 'deal',
      deal: deal,
      stageId: deal.stage_id
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging 
      ? 'none' // Remove transição durante drag para máxima fluidez
      : transition || 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Transição mais suave
    opacity: isDragging ? 0.5 : 1, // Mais visível durante drag
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} 
        ${isDragging ? 'ring-1 ring-blue-400/30 shadow-lg' : ''} 
        transition-shadow duration-150 ease-out
      `}
    >
      <KanbanDealCard
        deal={deal}
        index={index}
        onClick={onClick}
        getTemperatureTag={getTemperatureTag}
        tagColor={tagColor}
        isDragging={isDragging}
        isMobile={isMobile}
        stageAccentColor={stageAccentColor}
      />
    </div>
  );
}

export function KanbanView({
    deals,
    stages,
    isMobile,
    onDragEnd,
    onDealClick,
    onAddDeal,
    onAddDealToStage,
    getTemperatureTag,
    getStageColors,
    tagColor,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    stageDealsCount
}: KanbanViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const stageContainerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [activeDeal, setActiveDeal] = useState<MockDeal | null>(null);

    // Função para definir ref de um stage
    const setStageRef = useCallback((stageId: string, element: HTMLDivElement | null) => {
        if (element) {
            stageContainerRefs.current.set(stageId, element);
        } else {
            stageContainerRefs.current.delete(stageId);
        }
    }, []);

    // Hook para detectar scroll em cada stage container
    useEffect(() => {
        if (!hasNextPage || isFetchingNextPage) return;

        const handleScroll = (stageId: string) => (event: Event) => {
            const element = event.target as HTMLDivElement;
            const { scrollTop, scrollHeight, clientHeight } = element;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            
            console.log(`🔍 Scroll detectado no stage ${stageId}:`, {
                scrollTop,
                scrollHeight,
                clientHeight,
                distanceFromBottom,
                threshold: 100
            });
            
            if (distanceFromBottom <= 100) {
                console.log(`🎯 Scroll infinito ativado no stage ${stageId}!`);
                onLoadMore();
            }
        };

        const listeners = new Map<string, (event: Event) => void>();

        // Adiciona listeners para cada stage
        stages.forEach(stage => {
            const element = stageContainerRefs.current.get(stage.id);
            if (element) {
                const listener = handleScroll(stage.id);
                listeners.set(stage.id, listener);
                element.addEventListener('scroll', listener);
                console.log(`👂 Listener adicionado para stage ${stage.id}`);
            }
        });

        return () => {
            // Remove listeners
            listeners.forEach((listener, stageId) => {
                const element = stageContainerRefs.current.get(stageId);
                if (element) {
                    element.removeEventListener('scroll', listener);
                    console.log(`🧹 Listener removido do stage ${stageId}`);
                }
            });
        };
    }, [hasNextPage, isFetchingNextPage, onLoadMore, stages]);

    // Configuração dos sensores otimizada para máxima fluidez
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Mais estável que 1px, menos sensível a tremores
                tolerance: 5, // Tolerância para pequenos movimentos
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Detecção de colisão otimizada para máxima fluidez
    const customCollisionDetection = (args: any) => {
        // Se não há item ativo, usa detecção padrão
        if (!activeId) {
            return closestCenter(args);
        }

        // Prioriza detecção por ponteiro (mais fluida)
        const pointerIntersections = pointerWithin(args);
        
        if (pointerIntersections.length > 0) {
            // Filtra deals e stages
            const dealIntersections = pointerIntersections.filter(intersection => 
                deals.some(deal => deal.id === intersection.id)
            );
            
            const stageIntersections = pointerIntersections.filter(intersection => 
                stages.some(stage => stage.id === intersection.id)
            );

            // Prioriza deals para sortable fluido
            if (dealIntersections.length > 0) {
                return dealIntersections;
            }

            // Fallback para stages
            if (stageIntersections.length > 0) {
                return stageIntersections;
            }
        }

        // Fallback com closestCenter (mais fluido que rectIntersection)
        return closestCenter(args);
    };

    const handleAddDealToStage = (stageId: string) => {
        console.log(`Adicionar deal no estágio: ${stageId}`);
        if (onAddDealToStage) {
            onAddDealToStage(stageId);
        } else {
            onAddDeal();
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id);
        
        // Encontra o deal ativo imediatamente
        const deal = deals.find(d => d.id === active.id);
        setActiveDeal(deal || null);
        
        // Adiciona classe ao body para melhor UX
        document.body.style.cursor = 'grabbing';
    };

    const handleDragOver = (event: DragOverEvent) => {
        // Otimizado para performance - sem logs desnecessários
        // Apenas atualiza estado se necessário
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        // Limpa estado imediatamente
        setActiveId(null);
        setActiveDeal(null);
        document.body.style.cursor = '';
        
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Se soltou no mesmo lugar, não faz nada
        if (activeId === overId) return;

        // Encontra o deal ativo e o deal/stage de destino
        const activeDeal = deals.find(deal => deal.id === activeId);
        const overDeal = deals.find(deal => deal.id === overId);
        const overStage = stages.find(stage => stage.id === overId);
        
        if (!activeDeal) return;

        if (overDeal) {
            // Reordenação: soltou sobre um deal
            const targetStage = stages.find(stage => stage.id === overDeal.stage_id);
            if (targetStage) {
                onDragEnd({
                    ...event,
                    over: {
                        ...over,
                        id: targetStage.id
                    }
                });
            }
        } else if (overStage) {
            // Mudança direta para um stage
            onDragEnd(event);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <SortableContext 
                items={deals.map(d => d.id)} 
                strategy={verticalListSortingStrategy}
            >
                {isMobile ? (
                    // Layout mobile: vertical scroll com paginação
                    <div 
                        ref={scrollContainerRef}
                        className="h-full overflow-y-auto p-3 space-y-4 bg-gradient-to-br from-slate-50 to-slate-100"
                    >
                        {stages.map((stage, index) => {
                            const stageDeals = deals.filter((deal) => deal.stage_id === stage.id);
                            const valorTotalEtapa = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                            const stageColors = getStageColors(index);

                            return (
                                <div key={stage.id} className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-xl">
                                    {/* Header do Stage */}
                                    <div className={`bg-gradient-to-r ${stageColors.accent} p-4`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white text-sm">{stage.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-white/90 text-xs font-medium">
                                                        {new Intl.NumberFormat("pt-BR", {
                                                            style: "currency",
                                                            currency: "BRL",
                                                            notation: "compact",
                                                        }).format(valorTotalEtapa)}
                                                    </span>
                                                    <div className="w-1 h-1 bg-white/60 rounded-full" />
                                                    <span className="text-white/90 text-xs">
                                                        {stageDealsCount[stage.id] || 0} {(stageDealsCount[stage.id] || 0) === 1 ? 'deal' : 'deals'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm">{stageDeals.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body do Stage */}
                                    <div className="p-3">
                                        <DroppableStage 
                                            stage={stage}
                                            className="space-y-3 min-h-[120px] rounded-xl p-2"
                                            isEmpty={stageDeals.length === 0}
                                        >
                                            {stageDeals.map((deal, dealIndex) => (
                                                <DraggableDeal
                                                    key={deal.id}
                                                    deal={deal}
                                                    index={dealIndex}
                                                    onClick={onDealClick}
                                                    getTemperatureTag={getTemperatureTag}
                                                    tagColor={tagColor}
                                                    isMobile={true}
                                                    stageAccentColor={stageColors.accent}
                                                />
                                            ))}

                                            {/* Empty State */}
                                            {stageDeals.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                        <Activity className="h-5 w-5 text-slate-300" />
                                                    </div>
                                                    <p className="text-sm text-center font-medium">Nenhum deal</p>
                                                    <p className="text-xs text-center text-slate-400 mb-3">Arraste um deal ou crie um novo</p>
                                                </div>
                                            )}
                                        </DroppableStage>
                                    </div>

                                    {/* Footer do Stage - Mobile */}
                                    <div className="border-t border-slate-200/60 p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full group hover:bg-slate-50 transition-all duration-200 border border-dashed border-slate-300 hover:border-slate-400"
                                            onClick={() => handleAddDealToStage(stage.id)}
                                        >
                                            <Plus className="h-4 w-4 mr-2 text-slate-400 group-hover:text-slate-600 transition-colors duration-200 group-hover:scale-110" />
                                            <span className="text-slate-500 group-hover:text-slate-700 text-sm font-medium">
                                                Adicionar deal
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Indicador de carregamento mobile */}
                        {isFetchingNextPage && (
                            <div className="flex justify-center items-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                <span className="ml-2 text-sm text-slate-600">Carregando mais deals...</span>
                            </div>
                        )}

                        {/* Indicador de fim dos dados mobile */}
                        {!hasNextPage && deals.length > 0 && (
                            <div className="flex justify-center items-center py-4">
                                <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    Todos os deals foram carregados
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Layout desktop: horizontal Kanban com paginação
                    <div className="h-full relative">
                        <div 
                            ref={scrollContainerRef}
                            className="h-full flex gap-4 p-4 overflow-x-auto bg-gradient-to-br from-slate-50/50 to-white/80 backdrop-blur-sm"
                        >
                            {stages.map((stage, index) => {
                                const stageDeals = deals.filter((deal) => deal.stage_id === stage.id);
                                const valorTotalEtapa = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                                const stageColors = getStageColors(index);

                                return (
                                    <div key={stage.id} className="flex-shrink-0 w-72 flex flex-col">
                                        {/* Header do Stage */}
                                        <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200/60 border-b-0">
                                            <div className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-slate-800 text-sm">{stage.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-emerald-600 text-xs font-semibold">
                                                                {new Intl.NumberFormat("pt-BR", {
                                                                    style: "currency",
                                                                    currency: "BRL",
                                                                    notation: "compact",
                                                                }).format(valorTotalEtapa)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${stageColors.accent} flex items-center justify-center shadow-sm`}>
                                                            <span className="text-white font-bold text-sm">{stageDealsCount[stage.id] || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Body do Stage */}
                                        <div className="flex-1 bg-white border border-slate-200/60 border-t-0 border-b-0 shadow-sm overflow-y-auto">
                                            <DroppableStage 
                                                stage={stage}
                                                className="h-full p-3"
                                                isEmpty={stageDeals.length === 0}
                                            >
                                                <div 
                                                    ref={(el) => setStageRef(stage.id, el)}
                                                    className="space-y-3 overflow-y-auto" 
                                                    style={{ minHeight: '300px', maxHeight: '600px' }}
                                                >
                                                    {stageDeals.map((deal, dealIndex) => (
                                                        <DraggableDeal
                                                            key={deal.id}
                                                            deal={deal}
                                                            index={dealIndex}
                                                            onClick={onDealClick}
                                                            getTemperatureTag={getTemperatureTag}
                                                            tagColor={tagColor}
                                                            isMobile={false}
                                                            stageAccentColor={stageColors.accent}
                                                        />
                                                    ))}

                                                    {/* Indicador de carregamento dentro do stage */}
                                                    {isFetchingNextPage && stageDeals.length > 0 && (
                                                        <div className="flex justify-center items-center py-4">
                                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                            <span className="ml-2 text-xs text-slate-600">Carregando...</span>
                                                        </div>
                                                    )}

                                                    {/* Empty State */}
                                                    {stageDeals.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                                <Activity className="h-5 w-5 text-slate-300" />
                                                            </div>
                                                            <p className="text-sm text-center font-medium">Nenhum deal</p>
                                                            <p className="text-xs text-center text-slate-400 mb-3">Arraste um deal ou crie um novo</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </DroppableStage>
                                        </div>

                                        {/* Footer do Stage - Desktop */}
                                        <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200/60 border-t-0 p-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full group hover:bg-slate-50 transition-all duration-200 border border-dashed border-slate-300 hover:border-slate-400"
                                                onClick={() => handleAddDealToStage(stage.id)}
                                            >
                                                <Plus className="h-4 w-4 mr-2 text-slate-400 group-hover:text-slate-600 transition-colors duration-200 group-hover:scale-110" />
                                                <span className="text-slate-500 group-hover:text-slate-700 text-sm font-medium">
                                                    Adicionar deal
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Indicador de carregamento desktop */}
                        {isFetchingNextPage && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-200/60">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    <span className="text-sm text-slate-600">Carregando mais deals...</span>
                                </div>
                            </div>
                        )}

                        {/* Indicador de fim dos dados desktop */}
                        {!hasNextPage && deals.length > 0 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-100/90 backdrop-blur-sm rounded-full px-3 py-1">
                                <span className="text-xs text-slate-500">Todos os deals foram carregados</span>
                            </div>
                        )}
                    </div>
                )}
            </SortableContext>
            
            {/* DragOverlay otimizado para máxima fluidez */}
            <DragOverlay
                adjustScale={false}
                dropAnimation={{
                    duration: 200,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
            >
                {activeId && activeDeal ? (
                    <div className="transform scale-105 shadow-xl opacity-95 rotate-2">
                        <KanbanDealCard
                            deal={activeDeal}
                            index={0}
                            onClick={() => {}}
                            getTemperatureTag={getTemperatureTag}
                            tagColor={tagColor}
                            isDragging={true}
                            isMobile={isMobile}
                            stageAccentColor="from-blue-500 to-blue-600"
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
} 