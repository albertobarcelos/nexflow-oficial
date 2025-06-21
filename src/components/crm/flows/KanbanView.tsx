import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, TrendingUp, Users, Activity } from "lucide-react";
import { MockDeal, Stage, TemperatureTag, StageColors } from "./types";
import { KanbanDealCard } from "./KanbanDealCard";

interface KanbanViewProps {
    deals: MockDeal[];
    stages: Stage[];
    isMobile: boolean;
    onDragEnd: (result: DropResult) => void;
    onDealClick: (deal: MockDeal) => void;
    onAddDeal: () => void;
    onAddDealToStage?: (stageId: string) => void;
    getTemperatureTag: (temperature?: string) => TemperatureTag;
    getStageColors: (index: number) => StageColors;
    tagColor: (tag: string) => string;
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
    tagColor
}: KanbanViewProps) {
    const handleAddDealToStage = (stageId: string) => {
        console.log(`Adicionar deal no estágio: ${stageId}`);
        if (onAddDealToStage) {
            onAddDealToStage(stageId);
        } else {
            onAddDeal();
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {isMobile ? (
                // Layout mobile: vertical scroll
                <div className="h-full overflow-y-auto p-3 space-y-4 bg-gradient-to-br from-slate-50 to-slate-100">
                    {stages.map((stage, index) => {
                        const stageDeals = deals.filter((deal) => deal.stage_id === stage.id);
                        const valorTotalEtapa = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                        const stageColors = getStageColors(index);

                        return (
                            <div key={stage.id} className={`bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-xl`}>
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
                                                    {stageDeals.length} {stageDeals.length === 1 ? 'deal' : 'deals'}
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
                                    <Droppable droppableId={stage.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`space-y-3 min-h-[60px] transition-all duration-300 rounded-xl p-2 ${snapshot.isDraggingOver
                                                    ? 'bg-blue-50/80 border-2 border-dashed border-blue-300'
                                                    : ''
                                                    }`}
                                            >
                                                {stageDeals.map((deal, index) => (
                                                    <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <KanbanDealCard
                                                                deal={deal}
                                                                index={index}
                                                                onClick={onDealClick}
                                                                getTemperatureTag={getTemperatureTag}
                                                                tagColor={tagColor}
                                                                isDragging={snapshot.isDragging}
                                                                isMobile={true}
                                                                dragHandleProps={provided.dragHandleProps}
                                                                draggableProps={provided.draggableProps}
                                                                innerRef={provided.innerRef}
                                                                stageAccentColor={stageColors.accent}
                                                            />
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

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
                                            </div>
                                        )}
                                    </Droppable>
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
                </div>
            ) : (
                // Layout desktop: horizontal Kanban
                <div className="h-full relative">
                    <div className="h-full flex gap-4 p-4 overflow-x-auto bg-gradient-to-br from-slate-50/50 to-white/80 backdrop-blur-sm">
                        {stages.map((stage, index) => {
                            const stageDeals = deals.filter((deal) => deal.stage_id === stage.id);
                            const valorTotalEtapa = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
                            const stageColors = getStageColors(index);

                            return (
                                <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col">
                                    {/* Header do Stage com melhorias visuais */}
                                    <div className={`bg-white rounded-t-2xl shadow-sm border border-slate-200/60 border-b-0`}>
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
                                                        <span className="text-white font-bold text-sm">{stageDeals.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body do Stage */}
                                    <div className="flex-1 bg-white border border-slate-200/60 border-t-0 border-b-0 shadow-sm">
                                        <Droppable droppableId={stage.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`h-full p-3 transition-all duration-300 ${snapshot.isDraggingOver
                                                        ? 'bg-blue-50/80 border-2 border-dashed border-blue-300 border-l-0 border-r-0'
                                                        : ''
                                                        }`}
                                                    style={{ minHeight: '200px' }}
                                                >
                                                    <div className="space-y-3">
                                                        {stageDeals.map((deal, index) => (
                                                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <KanbanDealCard
                                                                        deal={deal}
                                                                        index={index}
                                                                        onClick={onDealClick}
                                                                        getTemperatureTag={getTemperatureTag}
                                                                        tagColor={tagColor}
                                                                        isDragging={snapshot.isDragging}
                                                                        isMobile={false}
                                                                        dragHandleProps={provided.dragHandleProps}
                                                                        draggableProps={provided.draggableProps}
                                                                        innerRef={provided.innerRef}
                                                                        stageAccentColor={stageColors.accent}
                                                                    />
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>

                                                    {/* Empty State */}
                                                    {stageDeals.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                                <Activity className="h-5 w-5 text-slate-300" />
                                                            </div>
                                                            <p className="text-sm text-center font-medium">Vazio</p>
                                                            <p className="text-xs text-center text-slate-400 mb-3">Arraste deals aqui</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>
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
                </div>
            )}
        </DragDropContext>
    );
} 