import { User, Phone, Mail, Clock, MessageSquare, Calendar, MoreHorizontal, Flame, Wind, Snowflake, Instagram, Video } from "lucide-react";
import { MockDeal, TemperatureTag } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps } from "@hello-pangea/dnd";

interface KanbanDealCardProps {
    deal: MockDeal;
    index: number;
    onClick: (deal: MockDeal) => void;
    getTemperatureTag: (temperature?: string) => TemperatureTag;
    tagColor: (tag: string) => string;
    isDragging?: boolean;
    isMobile?: boolean;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    draggableProps?: DraggableProvidedDraggableProps;
    innerRef?: (element: HTMLElement | null) => void;
    stageAccentColor?: string;
}

export function KanbanDealCard({
    deal,
    index,
    onClick,
    getTemperatureTag,
    tagColor,
    isDragging = false,
    isMobile = false,
    dragHandleProps,
    draggableProps,
    innerRef,
    stageAccentColor = 'from-blue-500 to-blue-600'
}: KanbanDealCardProps) {
    const tempTag = getTemperatureTag(deal.temperature);

    // Função para renderizar ícone de temperatura
    const renderTemperatureIcon = (temperature?: string) => {
        if (!temperature) return null;

        const tempTag = getTemperatureTag(temperature);

        let IconComponent;
        let colorClass;
        let backgroundClass;

        switch (temperature.toLowerCase()) {
            case 'hot':
                IconComponent = Flame;
                colorClass = 'text-red-500 hover:text-red-600';
                backgroundClass = 'bg-red-500/20';
                break;
            case 'warm':
                IconComponent = Wind;
                colorClass = 'text-orange-500 hover:text-orange-600';
                backgroundClass = 'bg-orange-500/20';
                break;
            case 'cold':
                IconComponent = Snowflake;
                colorClass = 'text-blue-500 hover:text-blue-600';
                backgroundClass = 'bg-blue-500/20';
                break;
            default:
                return null;
        }

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={`flex items-center justify-center h-5 w-5 ${backgroundClass} rounded-full`}>
                            <IconComponent className={`w-4 h-4 p-0.5 ${colorClass} transition-colors`} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tempTag.label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    // Calcular tempo desde criação
    const timeAgo = formatDistanceToNow(new Date(deal.created_at), {
        addSuffix: true,
        locale: ptBR
    });

    // Usar dados reais do responsável
    let responsibleName = "Sem responsável";
    const responsiblesArr = ((deal as unknown) as { responsibles?: { id: string, name: string }[] }).responsibles;
    if (responsiblesArr && Array.isArray(responsiblesArr) && responsiblesArr.length > 0) {
        responsibleName = responsiblesArr.map(r => r.name).join(", ");
    } else if (((deal as unknown) as { [key: string]: unknown })['responsible_name']) {
        responsibleName = ((deal as unknown) as { [key: string]: unknown })['responsible_name'] as string;
    }
    const responsible = {
        name: responsibleName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.responsible_id || deal.id}`
    };

    // Determinar se tem atividade recente (últimas 24h)
    const hasRecentActivity = deal.last_activity
        ? new Date(deal.last_activity) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        : new Date(deal.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

    const handleActionClick = (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        console.log(`Ação ${action} para deal ${deal.id}`);
        // Aqui você pode implementar as ações específicas
    };

    return (
        <div
            ref={innerRef}
            {...draggableProps}
            {...dragHandleProps}
            className={`group relative bg-white rounded-xl border border-slate-200/60 shadow-sm transition-all duration-300 cursor-pointer
                ${isDragging
                    ? 'shadow-2xl scale-105 rotate-2 z-50 border-blue-300'
                    : 'hover:shadow-lg hover:border-slate-300/80 hover:-translate-y-1'
                } 
                ${!isMobile ? 'mb-2' : 'mb-1.5'}
                `}
            style={{ ...draggableProps?.style }}
            onClick={() => onClick(deal)}
        >


            {/* Header do card com avatar proeminente */}
            <div className="p-3">
                <div className="flex items-start gap-3 mb-2">
                    {/* Avatar do responsável mais proeminente */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={responsible.avatar}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
                            alt={responsible.name}
                        />

                    </div>

                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                            <div className="flex gap-2">
                                {/* Título do deal */}
                                <h4 className="font-semibold text-slate-800 text-sm leading-tight">
                                    {deal.title} <span className="text-slate-400 ml-1 text-[10px]">{new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                        notation: "compact",
                                    }).format(deal.value || 0)}</span>
                                </h4>
                                {/* Tag de temperatura */}
                                <div className="flex gap-1">
                                    {renderTemperatureIcon(deal.temperature)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags de status */}
                <div className="flex items-center gap-1 mb-2">
                    {deal.tags && deal.tags.slice(0, 2).map(tag => (
                        <Badge
                            key={tag}
                            variant="outline"
                            className={`font-medium ${tagColor(tag)} border-0 mr-1`}
                            style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                            {tag}
                        </Badge>
                    ))}
                    {/* Ícones especiais para Instagram e Live */}
                    {deal.tags && deal.tags.includes('Instagram') && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Instagram className="w-4 h-4 text-pink-500" />
                                </TooltipTrigger>
                                <TooltipContent>Instagram</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {deal.tags && deal.tags.includes('Live') && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Video className="w-4 h-4 text-purple-500" />
                                </TooltipTrigger>
                                <TooltipContent>Live</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {deal.tags && deal.tags.length > 3 && (
                        <Badge variant="secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            +{deal.tags.length - 2}
                        </Badge>
                    )}
                </div>

                {/* Data e responsável */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate max-w-20">{responsible.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">{timeAgo.replace('há ', '').replace(' atrás', '')}</span>
                    </div>

                </div>

                {/* Ações rápidas */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => handleActionClick(e, 'call')}
                            title="Ligar"
                        >
                            <Phone className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            onClick={(e) => handleActionClick(e, 'email')}
                            title="Email"
                        >
                            <Mail className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            onClick={(e) => handleActionClick(e, 'notes')}
                            title="Notas"
                        >
                            <MessageSquare className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* Indicador de tempo e probabilidade */}
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">
                                {hasRecentActivity ? 'Ativo' : 'Parado'}
                            </span>
                        </div>
                        {deal.probability && (
                            <div className="text-xs font-medium text-slate-600">
                                {deal.probability}%
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Barra de progresso com cor do stage */}
            <div className="h-1 bg-gradient-to-r from-slate-100 to-slate-200 rounded-b-xl">
                <div
                    className={`h-full rounded-b-xl transition-all duration-500 bg-gradient-to-r ${stageAccentColor}`}
                    style={{ width: `${deal.probability || 50}%` }}
                />
            </div>
        </div>
    );
} 