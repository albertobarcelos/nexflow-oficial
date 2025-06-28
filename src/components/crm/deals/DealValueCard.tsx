import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Thermometer, CalendarDays } from "lucide-react";

interface MockDeal { value?: number; temperature?: string; created_at: string; }

export function DealValueCard({ deal }: { deal: MockDeal }) {
    const getTemperatureConfig = (temp?: string) => {
        switch (temp) {
            case 'hot': return {
                label: 'Quente',
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: Thermometer,
                iconColor: 'text-red-500'
            };
            case 'warm': return {
                label: 'Morno',
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: Thermometer,
                iconColor: 'text-orange-500'
            };
            case 'cold': return {
                label: 'Frio',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: Thermometer,
                iconColor: 'text-blue-500'
            };
            default: return {
                label: 'Novo',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: Thermometer,
                iconColor: 'text-gray-500'
            };
        }
    };
    const tempConfig = getTemperatureConfig(deal.temperature);
    const TempIcon = tempConfig.icon;
    return (
        <div className="space-y-3">
            <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-green-50/60 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-600 mb-1">Valor do Negócio</p>
                            <p className="text-xl font-bold text-emerald-700 truncate">
                                {deal.value ? deal.value.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL"
                                }) : "Não informado"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${tempConfig.icon === Thermometer ? 'bg-orange-100' : 'bg-slate-100'}`}>
                            <TempIcon className={`h-5 w-5 ${tempConfig.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-600 mb-1">Temperatura</p>
                            <Badge className={`${tempConfig.color} font-medium px-3 py-1 text-sm border-0`}>
                                {tempConfig.label}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-600 mb-1">Data Esperada</p>
                            <span className="text-xs text-slate-400">(em breve)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 