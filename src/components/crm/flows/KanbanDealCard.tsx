import { User, Phone, Mail, Clock, MessageSquare, Calendar, MoreHorizontal, Flame, Wind, Snowflake, Instagram, Video } from "lucide-react";
import { MockDeal, TemperatureTag } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { memo, useMemo, useCallback } from "react";

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

// 🚀 OTIMIZAÇÃO: Componente memoizado para evitar re-renderizações desnecessárias
export const KanbanDealCard = memo(function KanbanDealCard({
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

    // 🚀 OTIMIZAÇÃO: Memoizar dados calculados
    const timeAgo = useMemo(() => {
        return formatDistanceToNow(new Date(deal.created_at), {
            addSuffix: true,
            locale: ptBR
        });
    }, [deal.created_at]);

    // 🚀 OTIMIZAÇÃO: Memoizar dados do responsável
    const responsible = useMemo(() => {
        let responsibleName = "Sem responsável";
        let responsibleAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.responsible_id || deal.id}`;
        
        // 🆕 USAR DADOS REAIS DO RESPONSÁVEL
        if (deal.responsible) {
            responsibleName = `${deal.responsible.first_name || ''} ${deal.responsible.last_name || ''}`.trim();
            if (deal.responsible.avatar_url) {
                responsibleAvatar = deal.responsible.avatar_url;
            }
        } else if (deal.responsible_name) {
            responsibleName = deal.responsible_name;
        }
        
        return {
            name: responsibleName,
            avatar: responsibleAvatar,
            email: deal.responsible?.email
        };
    }, [deal.responsible, deal.responsible_name, deal.responsible_id, deal.id]);

    // 🚀 OTIMIZAÇÃO: Memoizar verificação de atividade recente
    const hasRecentActivity = useMemo(() => {
        return deal.last_activity
            ? new Date(deal.last_activity) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            : new Date(deal.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    }, [deal.last_activity, deal.created_at]);

    // 🚀 OTIMIZAÇÃO: Memoizar função para renderizar ícone de temperatura
    const renderTemperatureIcon = useCallback((temperature?: string) => {
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
    }, [getTemperatureTag]);

    // 🚀 OTIMIZAÇÃO: Memoizar função para renderizar barra de probabilidade
    const renderProbabilityBar = useCallback((probability?: number) => {
        if (!probability) return null;
        
        const getColorClass = (prob: number) => {
            if (prob >= 80) return 'bg-emerald-500';
            if (prob >= 60) return 'bg-yellow-500';
            if (prob >= 40) return 'bg-orange-500';
            return 'bg-red-500';
        };

        return (
            <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                    <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${getColorClass(probability)}`}
                        style={{ width: `${probability}%` }}
                    />
                </div>
                <span className="text-xs text-slate-500 font-medium">{probability}%</span>
            </div>
        );
    }, []);

    // 🚀 OTIMIZAÇÃO: Handlers memoizados
    const handleActionClick = useCallback((e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        console.log(`Ação ${action} para deal ${deal.id}`);
        // Aqui você pode implementar as ações específicas
    }, [deal.id]);

    const handleCardClick = useCallback((e: React.MouseEvent) => {
        // Não abre o modal se está sendo arrastado
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        onClick(deal);
    }, [isDragging, onClick, deal]);

    return (
        <div
            className={`group relative bg-white rounded-xl border border-slate-200/60 shadow-sm transition-all duration-200 
                ${isDragging
                    ? 'shadow-lg border-blue-300 bg-blue-50/20'
                    : 'hover:shadow-md hover:border-slate-300/80'
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
                    {/* 🆕 INDICADOR DE TIPO DE ENTIDADE */}
                    {deal.entity_type && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-300">
                            {deal.entity_type === 'company' ? 'Empresa' : 
                             deal.entity_type === 'person' ? 'Pessoa' : 'Parceiro'}
                        </Badge>
                    )}
                </div>

                {/* 🆕 BARRA DE PROBABILIDADE */}
                {deal.probability && deal.probability > 0 && (
                    <div className="mb-2">
                        {renderProbabilityBar(deal.probability)}
                    </div>
                )}

                {/* 🆕 DESCRIÇÃO EM TOOLTIP */}
                {deal.description && (
                    <div className="mb-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-xs text-slate-500 truncate cursor-help border-b border-dashed border-slate-300">
                                        {deal.description.length > 50 
                                            ? `${deal.description.substring(0, 50)}...` 
                                            : deal.description}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-sm">{deal.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}

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
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">Atividade recente</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {/* 🆕 INDICADOR DE DATA ESPERADA */}
                        {deal.expected_close_date && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Calendar className="w-3 h-3 text-orange-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            Previsão: {new Date(deal.expected_close_date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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

                {/* Timestamp e informações adicionais */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                            {deal.last_activity && deal.last_activity !== deal.created_at 
                                ? `Atividade: ${formatDistanceToNow(new Date(deal.last_activity), { addSuffix: true, locale: ptBR })}`
                                : timeAgo
                            }
                        </span>
                    </div>
                    
                    {/* 🆕 INFORMAÇÕES DE ORIGEM */}
                    {deal.origin_name && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                        {deal.origin_name}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">Origem do lead</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                {/* 🆕 INFORMAÇÕES DO RESPONSÁVEL */}
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">Por:</span>
                        <span className="text-xs text-slate-600 font-medium">{responsible.name}</span>
                    </div>
                    
                    {/* 🆕 NOTAS INDICATOR */}
                    {deal.notes && deal.notes.trim() && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MessageSquare className="w-3 h-3 text-blue-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="text-sm">{deal.notes}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {/* Indicador de drag melhorado */}
            {isDragging && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none" />
            )}
        </div>
    );
}); 