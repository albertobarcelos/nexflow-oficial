import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, List, Phone, Mail, ArrowRight } from "lucide-react";
import { MockDeal, Stage, TemperatureTag } from "./types";

interface ListViewProps {
    deals: MockDeal[];
    stages: Stage[];
    onDealClick: (deal: MockDeal) => void;
    onAddDeal: () => void;
    getTemperatureTag: (temperature?: string) => TemperatureTag;
}

export function ListView({ deals, stages, onDealClick, onAddDeal, getTemperatureTag }: ListViewProps) {
    return (
        <div className="h-full overflow-y-auto p-2 md:p-3">
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

                {/* Empty State Lista */}
                {deals.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                            <List className="h-4 w-4 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-600 mb-1">Nenhum negócio</h3>
                        <p className="text-xs text-slate-500 mb-2">Adicione seu primeiro negócio</p>
                        <Button size="sm" className="h-6 text-xs" onClick={onAddDeal}>
                            <Plus className="h-2.5 w-2.5 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
} 