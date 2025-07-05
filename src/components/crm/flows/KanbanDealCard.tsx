import { User, Phone, Mail, Clock, MessageSquare, Calendar, MoreHorizontal, Flame, Wind, Snowflake, Instagram, Video } from "lucide-react";
import { MockDeal, TemperatureTag } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KanbanDealCardProps {
    deal: MockDeal;
    index: number;
    onClick: (deal: MockDeal) => void;
    getTemperatureTag: (temperature?: string) => TemperatureTag;
    tagColor: (tag: string) => string;
    isDragging?: boolean;
    isMobile?: boolean;
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

    const handleCardClick = (e: React.MouseEvent) => {
        // Não abre o modal se está sendo arrastado
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        onClick(deal);
    };

    return (
        <div
            className={`group relative bg-white rounded-xl border border-slate-200/60 shadow-sm transition-all duration-300 
                ${isDragging
                    ? 'shadow-2xl scale-105 rotate-2 z-50 border-blue-300 ring-2 ring-blue-200'
                    : 'hover:shadow-lg hover:border-slate-300/80 hover:-translate-y-1 cursor-pointer'
                } 
                ${!isMobile ? 'mb-2' : 'mb-1.5'}
                `}
            onClick={handleCardClick}
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
                            +{deal.tags.length - 3}
                        </Badge>
                    )}
                </div>

                {/* Informações da empresa/pessoa */}
                <div className="flex items-center gap-2 mb-2">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600 truncate">
                        {deal.companies?.name || deal.people?.name || "Sem empresa/pessoa"}
                    </span>
                </div>

                {/* Valor e ações */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 text-sm">
                            {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                notation: "compact",
                            }).format(deal.value || 0)}
                        </span>
                        {hasRecentActivity && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                    </div>

                    {/* Ações rápidas - apenas se não estiver sendo arrastado */}
                    {!isDragging && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-slate-100"
                                            onClick={(e) => handleActionClick(e, 'call')}
                                        >
                                            <Phone className="h-3 w-3 text-slate-500" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ligar</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-slate-100"
                                            onClick={(e) => handleActionClick(e, 'email')}
                                        >
                                            <Mail className="h-3 w-3 text-slate-500" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>E-mail</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-slate-100"
                                            onClick={(e) => handleActionClick(e, 'message')}
                                        >
                                            <MessageSquare className="h-3 w-3 text-slate-500" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Mensagem</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{timeAgo}</span>
                    <span className="text-xs text-slate-400 ml-auto">
                        {responsible.name}
                    </span>
                </div>
            </div>

            {/* Indicador de drag melhorado */}
            {isDragging && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none" />
            )}
        </div>
    );
} 