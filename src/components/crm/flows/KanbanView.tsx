import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Users, Activity, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { MockDeal, Stage, TemperatureTag, StageColors } from "./types";
import { KanbanDealCard } from "./KanbanDealCard";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import React from "react";
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
    // Propriedades de scroll infinito GLOBAL (depreciadas)
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    // Contagens por stage
    stageDealsCount: Record<string, number>;
    // 🎯 NOVA: Função para carregar mais deals de um stage específico
    onLoadMoreForStage?: (stageId: string) => void;
    // 🎯 NOVA: Estado de paginação por stage
    stagePagination?: Record<string, { 
        hasNextPage: boolean; 
        isFetching: boolean; 
        deals: MockDeal[];
        page: number;
    }>;
    // 🎯 NOVA: Estado completo dos deals por stage
    stageDealsState?: Record<string, {
        deals: MockDeal[];
        hasNextPage: boolean;
        isFetching: boolean;
        page: number;
    }>;
}

// 🚀 NOVO: Componente DropZone específico e preciso
const DropZone = React.memo(({ 
  stageId, 
  position, 
  isActive,
  index
}: { 
  stageId: string; 
  position: 'between' | 'bottom';
  isActive: boolean;
  index?: number;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${stageId}-${position}${index !== undefined ? `-${index}` : ''}`,
  });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ease-out ${
        position === 'between' ? 'h-4 mx-2 my-1' : 'h-16 mx-2 mt-2'
      } ${
        isOver 
          ? 'bg-blue-500/30 border-2 border-dashed border-blue-500 rounded-lg scale-105' 
          : 'border-2 border-dashed border-blue-200/60 hover:border-blue-300/80 rounded-lg opacity-60'
      }`}
      style={{
        minHeight: position === 'between' ? '16px' : '64px',
      }}
    >
      {isOver && (
        <div className="flex items-center justify-center h-full">
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium animate-pulse shadow-lg">
            ✓ Soltar aqui
          </div>
        </div>
      )}
      {!isOver && isActive && (
        <div className="flex items-center justify-center h-full opacity-60">
          <div className="text-blue-400 text-xs font-medium">
            {position === 'between' ? '┈┈┈' : ''}
          </div>
        </div>
      )}
    </div>
  );
});

// 🚀 COMPONENTE SIMPLIFICADO: Container da etapa que aceita drops diretos
const StageContainer = React.memo(({ 
  stage, 
  children, 
  className = ""
}: { 
  stage: Stage; 
  children: React.ReactNode; 
  className?: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id, // ID direto do stage para drops
  });

  return (
    <div 
      ref={setNodeRef}
      className={`${className} relative ${isOver ? 'bg-blue-50/50' : ''}`}
    >
      {children}
    </div>
  );
});

// 🚀 COMPONENTE OTIMIZADO: DraggableDeal com React.memo
const DraggableDeal = React.memo(({ 
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
}) => {
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
    transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    scale: isDragging ? '0.98' : '1',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`
        ${isDragging 
          ? 'cursor-grabbing shadow-lg ring-2 ring-blue-300/50' 
          : 'cursor-grab hover:shadow-md hover:scale-[1.02]'
        } 
        transition-all duration-150 ease-out
        transform-gpu
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
});

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
    stageDealsCount,
    onLoadMoreForStage,
    stagePagination,
    stageDealsState
}: KanbanViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [activeDeal, setActiveDeal] = useState<MockDeal | null>(null);

    // 🚀 MEMOIZAÇÃO OTIMIZADA: Usar dados das etapas individuais
    const dealsByStage = useMemo(() => {
        if (!stages || stages.length === 0) {
            return new Map<string, MockDeal[]>();
        }
        
        const dealsMap = new Map<string, MockDeal[]>();
        
        // 🚀 PRIORIDADE: Usar dados das etapas se disponível
        if (stageDealsState && Object.keys(stageDealsState).length > 0) {
            stages.forEach(stage => {
                const stageData = stageDealsState[stage.id];
                dealsMap.set(stage.id, stageData?.deals || []);
            });
        } else {
            // 🚀 FALLBACK: Usar deals globais se dados das etapas não estiver disponível
            stages.forEach(stage => {
                dealsMap.set(stage.id, []);
            });
            
            if (deals && deals.length > 0) {
                deals.forEach(deal => {
                    const stageDeals = dealsMap.get(deal.stage_id);
                    if (stageDeals) {
                        stageDeals.push(deal);
                    }
                });
            }
        }
        
        return dealsMap;
    }, [stages, stageDealsState, deals]);

    // 🚀 SENSORES OTIMIZADOS: Configuração mais simples
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 🚀 HANDLERS OTIMIZADOS: Usando useCallback para evitar re-criação
    const handleAddDealToStage = useCallback((stageId: string) => {
        if (onAddDealToStage) {
            onAddDealToStage(stageId);
        }
    }, [onAddDealToStage]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id);
        
        const deal = deals.find(d => d.id === active.id);
        setActiveDeal(deal || null);
    }, [deals]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        // Intencionalmente vazio - apenas para tracking
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        setActiveDeal(null);
        
        const { active, over } = event;
        
        if (!over) return;
        
        const activeId = active.id as string;
        const overId = over.id as string;
        
        // Extrair stageId do target
        let targetStageId = overId;
        
        // Se é uma drop zone (contém hífen), extrair apenas o stageId
        if (overId.includes('-')) {
            targetStageId = overId.split('-')[0];
        } else {
            // Pode ser outro deal - pegar o stage do deal
            const targetDeal = deals.find(d => d.id === overId);
            if (targetDeal) {
                targetStageId = targetDeal.stage_id;
            } else {
                // Verificar se é um stage válido
                const isValidStage = stages.find(s => s.id === overId);
                if (!isValidStage) {
                    return; // Target inválido
                }
            }
        }
        
        // Encontrar o deal sendo arrastado
        const draggedDeal = deals.find(deal => deal.id === activeId);
        if (!draggedDeal) return;

        // Se não mudou de stage, não fazer nada
        if (draggedDeal.stage_id === targetStageId) return;
        
        // Chamar o handler externo
        onDragEnd({
            ...event,
            over: {
                ...event.over!,
                id: targetStageId
            }
        });
    }, [deals, stages, onDragEnd]);

    // 🚀 FUNÇÃO OTIMIZADA: Carregar mais deals de uma etapa específica
    const handleLoadMoreForStage = useCallback((stageId: string) => {
        if (onLoadMoreForStage) {
            onLoadMoreForStage(stageId);
        }
    }, [onLoadMoreForStage]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <SortableContext 
                items={deals.map(deal => deal.id)} 
                strategy={verticalListSortingStrategy}
            >
                {isMobile ? (
                    // Layout mobile: vertical scroll com paginação
                    <div 
                        ref={scrollContainerRef}
                        className="h-full overflow-y-auto p-3 space-y-4 bg-gradient-to-br from-slate-50 to-slate-100"
                    >
                        {stages.map((stage, index) => {
                            const stageDeals = dealsByStage.get(stage.id) || [];
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
                                                    <span className="text-white font-bold text-sm">{stageDealsCount[stage.id] || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body do Stage */}
                                    <div className="p-3">
                                        <StageContainer 
                                            stage={stage}
                                            className="space-y-3 min-h-[120px] rounded-xl p-2"
                                        >
                                            {/* DropZone no topo para stages vazios */}
                                            {stageDeals.length === 0 && (
                                                <DropZone 
                                                    stageId={stage.id} 
                                                    position="bottom" 
                                                    isActive={!!activeId} 
                                                />
                                            )}

                                            {/* DropZone no topo da lista (antes do primeiro card) */}
                                            {stageDeals.length > 0 && (
                                                <DropZone 
                                                    stageId={stage.id} 
                                                    position="between" 
                                                    isActive={!!activeId}
                                                    index={0}
                                                />
                                            )}

                                            {stageDeals.map((deal, dealIndex) => (
                                                <React.Fragment key={deal.id}>
                                                    <DraggableDeal
                                                        deal={deal}
                                                        index={dealIndex}
                                                        onClick={onDealClick}
                                                        getTemperatureTag={getTemperatureTag}
                                                        tagColor={tagColor}
                                                        isMobile={true}
                                                        stageAccentColor={stageColors.accent}
                                                    />
                                                    
                                                    {/* DropZone após cada card */}
                                                    <DropZone 
                                                        stageId={stage.id} 
                                                        position="between" 
                                                        isActive={!!activeId}
                                                        index={dealIndex + 1}
                                                    />
                                                </React.Fragment>
                                            ))}

                                            {/* DropZone no final da lista para stages com cards */}
                                            {stageDeals.length > 0 && (
                                                <DropZone 
                                                    stageId={stage.id} 
                                                    position="bottom" 
                                                    isActive={!!activeId} 
                                                />
                                            )}

                                            {/* 🎯 NOVO: Indicador de carregamento específico do stage mobile */}
                                            {stageDealsState?.[stage.id]?.isFetching && (
                                                <div className="flex justify-center items-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                    <span className="ml-2 text-xs text-slate-600">Carregando mais...</span>
                                                </div>
                                            )}

                                            {/* 🎯 NOVO: Botão para carregar mais deals da etapa mobile */}
                                            {stageDealsState?.[stage.id]?.hasNextPage && !stageDealsState[stage.id].isFetching && (
                                                <div className="flex justify-center items-center py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-slate-500 hover:text-slate-700"
                                                        onClick={() => handleLoadMoreForStage(stage.id)}
                                                    >
                                                        Carregar mais deals
                                                    </Button>
                                                </div>
                                            )}

                                            {/* 🎯 NOVO: Indicador de fim dos dados específico do stage mobile */}
                                            {stageDealsState?.[stage.id] && 
                                             !stageDealsState[stage.id].hasNextPage && 
                                             !stageDealsState[stage.id].isFetching && 
                                             stageDeals.length > 0 && (
                                                <div className="flex justify-center items-center py-2">
                                                    <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                        Todos os deals carregados
                                                    </div>
                                                </div>
                                            )}

                                            {/* Empty State */}
                                            {stageDeals.length === 0 && !stageDealsState?.[stage.id]?.isFetching && (
                                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                        <Activity className="h-5 w-5 text-slate-300" />
                                                    </div>
                                                    <p className="text-sm text-center font-medium">Nenhum deal</p>
                                                    <p className="text-xs text-center text-slate-400 mb-3">Arraste um deal ou crie um novo</p>
                                                </div>
                                            )}
                                        </StageContainer>
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
                                const stageDeals = dealsByStage.get(stage.id) || [];
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
                                            <StageContainer 
                                                stage={stage}
                                                className="h-full p-3"
                                            >
                                                <div 
                                                    className="space-y-3 overflow-y-auto" 
                                                    style={{ minHeight: '300px', maxHeight: '600px' }}
                                                >
                                                    {/* DropZone no topo para stages vazios */}
                                                    {stageDeals.length === 0 && (
                                                        <DropZone 
                                                            stageId={stage.id} 
                                                            position="bottom" 
                                                            isActive={!!activeId} 
                                                        />
                                                    )}

                                                    {/* DropZone no topo da lista (antes do primeiro card) */}
                                                    {stageDeals.length > 0 && (
                                                        <DropZone 
                                                            stageId={stage.id} 
                                                            position="between" 
                                                            isActive={!!activeId}
                                                            index={0}
                                                        />
                                                    )}

                                                    {stageDeals.map((deal, dealIndex) => (
                                                        <React.Fragment key={deal.id}>
                                                            <DraggableDeal
                                                                deal={deal}
                                                                index={dealIndex}
                                                                onClick={onDealClick}
                                                                getTemperatureTag={getTemperatureTag}
                                                                tagColor={tagColor}
                                                                isMobile={false}
                                                                stageAccentColor={stageColors.accent}
                                                            />
                                                            
                                                            {/* DropZone após cada card */}
                                                            <DropZone 
                                                                stageId={stage.id} 
                                                                position="between" 
                                                                isActive={!!activeId}
                                                                index={dealIndex + 1}
                                                            />
                                                        </React.Fragment>
                                                    ))}

                                                    {/* DropZone no final da lista */}
                                                    {stageDeals.length > 0 && (
                                                        <DropZone 
                                                            stageId={stage.id} 
                                                            position="bottom" 
                                                            isActive={!!activeId} 
                                                        />
                                                    )}

                                                    {/* 🎯 NOVO: Indicador de carregamento específico do stage */}
                                                    {stageDealsState?.[stage.id]?.isFetching && (
                                                        <div className="flex justify-center items-center py-4">
                                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                            <span className="ml-2 text-xs text-slate-600">Carregando mais...</span>
                                                        </div>
                                                    )}

                                                    {/* 🎯 NOVO: Botão para carregar mais deals da etapa */}
                                                    {stageDealsState?.[stage.id]?.hasNextPage && !stageDealsState[stage.id].isFetching && (
                                                        <div className="flex justify-center items-center py-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-xs text-slate-500 hover:text-slate-700"
                                                                onClick={() => handleLoadMoreForStage(stage.id)}
                                                            >
                                                                Carregar mais deals
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* 🎯 NOVO: Indicador de fim dos dados específico do stage */}
                                                    {stageDealsState?.[stage.id] && 
                                                     !stageDealsState[stage.id].hasNextPage && 
                                                     !stageDealsState[stage.id].isFetching && 
                                                     stageDeals.length > 0 && (
                                                        <div className="flex justify-center items-center py-2">
                                                            <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                                Todos os deals carregados
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Empty State */}
                                                    {stageDeals.length === 0 && !stageDealsState?.[stage.id]?.isFetching && (
                                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                                <Activity className="h-5 w-5 text-slate-300" />
                                                            </div>
                                                            <p className="text-sm text-center font-medium">Nenhum deal</p>
                                                            <p className="text-xs text-center text-slate-400 mb-3">Arraste um deal ou crie um novo</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </StageContainer>
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
            
            {/* DragOverlay CORRIGIDO - sem transformações que interferem com o movimento */}
            <DragOverlay
                style={{ 
                    zIndex: 9999,
                }}
                dropAnimation={{
                    duration: 150,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
            >
                {activeId && activeDeal ? (
                    <div className="relative">
                        {/* Card principal limpo, sem transformações problemáticas */}
                        <div className="bg-white border border-blue-300 rounded-xl overflow-hidden shadow-2xl">
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
                        
                        {/* Indicador de movimento simples */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
} 