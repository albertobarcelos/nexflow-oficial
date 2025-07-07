import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  Thermometer, 
  Plus, 
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  ArrowRight,
  List
} from "lucide-react";
import { MockDeal, Stage, TemperatureTag } from "./types";
import { useRef, useEffect, memo } from "react";
import { useElementScrollToBottom } from "@/hooks/useVirtualPagination";

interface ListViewProps {
    deals: MockDeal[];
    stages: Stage[];
    onDealClick: (deal: MockDeal) => void;
    onAddDeal: () => void;
    getTemperatureTag: (temperature?: string) => TemperatureTag;
    // Propriedades de scroll infinito GLOBAL para ListView
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    // 🎯 NOVO: Contador total de deals no banco
    totalDealsCount?: number;
}

// 🚀 OTIMIZAÇÃO: Component memo para reduzir re-renderizações desnecessárias
export const ListView = memo(function ListView({ 
    deals, 
    stages, 
    onDealClick, 
    onAddDeal, 
    getTemperatureTag,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    totalDealsCount
}: ListViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isDev = process.env.NODE_ENV === 'development';

    // 🚀 OTIMIZAÇÃO: useEffect otimizado - só executa em desenvolvimento
    useEffect(() => {
        if (isDev) {
            console.log('🔍 ListView - Estado da paginação:', {
                dealsCarregados: deals.length,
                totalDealsCount: totalDealsCount || 'não informado',
                hasNextPage,
                isFetchingNextPage,
                temOnLoadMore: !!onLoadMore
            });
        }
    }, [deals.length, totalDealsCount, hasNextPage, isFetchingNextPage, onLoadMore, isDev]);

    // 🚀 OTIMIZAÇÃO: Hook de scroll otimizado com signature atualizada
    useElementScrollToBottom(
        scrollContainerRef,
        () => {
            if (isDev) console.log('🎯 ListView - Scroll infinito ativado! Carregando mais dados...');
            if (hasNextPage && !isFetchingNextPage && onLoadMore) {
                onLoadMore();
            }
        },
        500, // 🚀 OTIMIZAÇÃO: Threshold maior para evitar triggers múltiplos
        hasNextPage && !isFetchingNextPage
    );

    return (
        <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto p-2 md:p-3"
        >
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header da tabela */}
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center text-xs font-medium text-slate-600">
                        <div className="md:col-span-2">Negócio</div>
                        <div className="hidden md:block">Etapa</div>
                        <div className="hidden md:block">Valor</div>
                        <div className="hidden md:block">Responsável</div>
                        <div className="hidden md:block">Ações</div>
                    </div>
                </div>

                {/* Lista de negócios */}
                <div className="divide-y divide-slate-200">
                    {deals.map((deal) => {
                        const stage = stages.find(s => s.id === deal.stage_id);
                        const tempTag = getTemperatureTag(deal.temperature);
                        return (
                            <div key={deal.id} className="px-3 py-2 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => onDealClick(deal)}>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                                    {/* Negócio */}
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-800 text-xs truncate">{deal.title}</h4>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${tempTag.color}`}>
                                                        {tempTag.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Etapa */}
                                    <div className="hidden md:block">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 py-0.5">
                                            {stage?.name}
                                        </Badge>
                                    </div>

                                    {/* Valor */}
                                    <div className="hidden md:block">
                                        <span className="font-bold text-emerald-700 text-xs">
                                            {new Intl.NumberFormat("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                                notation: "compact",
                                            }).format(deal.value || 0)}
                                        </span>
                                    </div>

                                    {/* Responsável */}
                                    <div className="hidden md:block">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.responsible_id || deal.id}`}
                                                className="w-7 h-7 rounded-full object-cover"
                                                alt={deal.responsible_name || "Sem responsável"}
                                            />
                                            <span className="text-xs text-slate-600">{deal.responsible_name || "Sem responsável"}</span>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="hidden md:block">
                                        <div className="flex items-center gap-0.5">
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                                <Phone className="h-2.5 w-2.5 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                                <Mail className="h-2.5 w-2.5 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                                <ArrowRight className="h-2.5 w-2.5 text-slate-500" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Mobile: informações condensadas */}
                                    <div className="md:hidden flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1 py-0.5">
                                                {stage?.name}
                                            </Badge>
                                            <span className="font-bold text-emerald-700 text-xs">
                                                {new Intl.NumberFormat("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                    notation: "compact",
                                                }).format(deal.value || 0)}
                                            </span>
                                        </div>
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deal.responsible_id || deal.id}`}
                                            className="w-7 h-7 rounded-full object-cover"
                                            alt={deal.responsible_name || "Sem responsável"}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Indicador de carregamento */}
                {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-6 border-t border-slate-200">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-sm text-slate-600">Carregando mais deals...</span>
                    </div>
                )}

                {/* Indicador de fim dos dados */}
                {!hasNextPage && deals.length > 0 && (
                    <div className="flex justify-center items-center py-4 border-t border-slate-200">
                        <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                            Todos os deals foram carregados
                        </div>
                    </div>
                )}

                {/* Estado vazio */}
                {deals.length === 0 && !isFetchingNextPage && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <List className="h-5 w-5 text-slate-300" />
                        </div>
                        <p className="text-sm text-center font-medium">Nenhum deal encontrado</p>
                        <p className="text-xs text-center text-slate-400 mb-4">Crie um novo deal para começar</p>
                        <Button onClick={onAddDeal} size="sm" className="h-8">
                            <Plus className="h-3 w-3 mr-1" />
                            Criar Deal
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}); 