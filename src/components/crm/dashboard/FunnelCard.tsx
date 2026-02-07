import { Hash, Filter, CheckCircle, ArrowDown, Users, Wrench, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Métricas do funil para exibição (contagens e opcional valor em R$) */
export interface FunnelMetrics {
  /** Contatos novos / indicações */
  indications: number;
  /** Em progresso / oportunidades */
  opportunities: number;
  /** Concluídos / cards completos */
  completedCards: number;
  /** Opcional: valor total indicações (para exibir R$) */
  indicationsValue?: number;
  /** Opcional: valor total oportunidades */
  opportunitiesValue?: number;
  /** Opcional: valor total concluídos */
  completedValue?: number;
}

interface FunnelCardProps {
  metrics: FunnelMetrics;
  isLoading?: boolean;
  onVerDetalhes?: () => void;
}

/** Percentual de conversão entre etapas (ex.: indicações -> oportunidades) */
function convPercent(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round((to / from) * 100);
}

function formatCurrency(value: number | undefined): string {
  if (value == null || value === 0) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FunnelCard({
  metrics,
  isLoading,
  onVerDetalhes,
}: FunnelCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border-light p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-gray-100 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  const conv1 = convPercent(metrics.indications, metrics.opportunities);
  const conv2 = convPercent(metrics.opportunities, metrics.completedCards);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Status Geral
          </h2>
          <p className="text-sm text-slate-500">Status geral das entidades</p>
         
        </div>
        {onVerDetalhes && (
          <button
            type="button"
            onClick={onVerDetalhes}
            className="text-primary hover:text-orange-600 text-sm font-medium flex items-center gap-1"
          >
            Ir para flows <ArrowDown className="h-4 w-4 rotate-[-90deg]" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 items-center w-full">
        {/* Etapa 1: Contatos novos (azul) - 100% */}
        <div className="w-full max-w-4xl relative group cursor-pointer">
          <div
            className={cn(
              "h-14 rounded-lg flex items-center justify-between px-6 border transition-all relative overflow-hidden",
              "bg-blue-50 border-blue-100",
              "hover:border-blue-300"
            )}
          >
            <div className="absolute top-0 bottom-0 left-0 bg-blue-500 opacity-10 w-full" />
            <div className="flex items-center gap-3 z-10">
              <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-semibold text-slate-700">
                contatos novos
              </span>
            </div>
            <div className="flex items-center gap-6 z-10">
              <span className="text-slate-500 text-sm">
                {metrics.indications} Contatos
              </span>
              <span className="font-bold text-slate-800 text-lg">
                {formatCurrency(metrics.indicationsValue)}
              </span>
            </div>
          </div>
          <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 z-20 text-slate-300">
            <ArrowDown className="h-4 w-4" />
          </div>
        </div>

        {/* Etapa 2: Em progresso (laranja) - 70% */}
        <div className="w-[100%] max-w-4xl relative group cursor-pointer">
          <div
            className={cn(
              "h-14 rounded-lg flex items-center justify-between px-6 border transition-all relative overflow-hidden",
              "bg-orange-50 border-orange-100",
              "hover:border-orange-300"
            )}
          >
            <div className="absolute top-0 bottom-0 left-0 bg-orange-500 opacity-10 w-full" />
            <div className="flex items-center gap-3 z-10">
              <div className="bg-orange-100 text-orange-600 p-1.5 rounded-md">
                <Loader2 className="h-5 w-5" />
              </div>
              <span className="font-semibold text-slate-700">
                em progresso
              </span>
            </div>
            <div className="flex items-center gap-6 z-10">
              {metrics.indications > 0 && (
                <span className="text-xs font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  {conv1}% conv.
                </span>
              )}
              <span className="text-slate-500 text-sm">
                {metrics.opportunities} Contatos
              </span>
              <span className="font-bold text-slate-800 text-lg">
                {formatCurrency(metrics.opportunitiesValue)}
              </span>
            </div>
          </div>
          <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 z-20 text-slate-300">
            <ArrowDown className="h-4 w-4" />
          </div>
        </div>

        {/* Etapa 3: Concluído (verde) - 60% */}
        <div className="w-[100%] max-w-4xl relative group cursor-pointer">
          <div
            className={cn(
              "h-14 rounded-lg flex items-center justify-between px-6 border transition-all relative overflow-hidden",
              "bg-emerald-50 border-emerald-200",
              "hover:border-emerald-400 hover:shadow-md"
            )}
          >
            <div className="absolute top-0 bottom-0 left-0 bg-emerald-500 opacity-10 w-full" />
            <div className="flex items-center gap-3 z-10">
              <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-md">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="font-bold text-emerald-700">
                concluído
              </span>
            </div>
            <div className="flex items-center gap-6 z-10">
              {metrics.opportunities > 0 && (
                <span className="text-xs font-mono bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                  {conv2}% conv.
                </span>
              )}
              <span className="text-slate-500 text-sm">
                {metrics.completedCards} Contatos
              </span>
              <span className="font-bold text-emerald-700 text-xl">
                {formatCurrency(metrics.completedValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
