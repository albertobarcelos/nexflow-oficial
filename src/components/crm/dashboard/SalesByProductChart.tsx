import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/format";

/** Um item do gráfico: label (ex. nome do produto/flow) e valor */
export interface SalesByProductItem {
  label: string;
  value: number;
}

interface SalesByProductChartProps {
  /** Dados para as barras; vazio = placeholder */
  data?: SalesByProductItem[];
  isLoading?: boolean;
}

/** Altura máxima das barras em px */
const BAR_MAX_HEIGHT = 160;

export function SalesByProductChart({
  data = [],
  isLoading,
}: SalesByProductChartProps) {
  const maxValue = data.length
    ? Math.max(...data.map((d) => d.value), 1)
    : 1;

  /** Cores por índice (ciclo para vários produtos) */
  const barColors = [
    { bg: "bg-blue-100", fill: "bg-blue-500" },
    { bg: "bg-orange-100", fill: "bg-primary-orange" },
    { bg: "bg-indigo-100", fill: "bg-indigo-500" },
    { bg: "bg-purple-100", fill: "bg-purple-500" },
    { bg: "bg-emerald-100", fill: "bg-emerald-500" },
    { bg: "bg-amber-100", fill: "bg-amber-500" },
    { bg: "bg-rose-100", fill: "bg-rose-500" },
    { bg: "bg-cyan-100", fill: "bg-cyan-500" },
  ];

  const hasData = data.length > 0;
  const displayData = hasData ? data : [];

  if (isLoading) {
    return (
      <div className="bg-white  rounded-xl shadow-sm border border-border-light  p-6 animate-pulse">
        <div className="flex justify-between items-start mb-6">
          <div className="h-5 bg-gray-200  rounded w-48" />
          <div className="h-8 w-8 bg-gray-200  rounded" />
        </div>
        <div className="h-64 flex items-end justify-around gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-16 bg-gray-100  rounded-t-lg h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-border-light  p-6 flex-2">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 ">
            Vendas por produto
          </h2>
          <p className="text-xs text-slate-500 ">
            Distribuição de receita por produto/serviço (itens de orçamento)
          </p>
        </div>
        
      </div>

      {!hasData ? (
        <div className="relative h-64 w-full flex items-center justify-center">
          <p className="text-sm text-slate-500  text-center px-4">
            Nenhum produto em orçamentos ainda. Os itens criados em orçamentos
            aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="relative h-64 w-full">
          {/* Linhas de grade horizontais */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full h-px bg-slate-100 "
              />
            ))}
          </div>

          {/* Barras */}
          <div className="absolute inset-0 flex items-end justify-around gap-1 px-2">
            {displayData.map((item, index) => {
              const heightPercent =
                maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const heightPx = Math.max(
                4,
                (heightPercent / 100) * BAR_MAX_HEIGHT
              );
              const colors = barColors[index % barColors.length];
              return (
                <Tooltip key={`${item.label}-${index}`}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 min-w-0 max-w-[80px] flex flex-col items-center gap-2 group cursor-help">
                      <div
                        className={cn(
                          "relative w-full rounded-t-lg overflow-hidden h-40 transition-all",
                          colors.bg
                        )}
                      >
                        <div
                          className={cn(
                            "absolute bottom-0 w-full rounded-t-lg",
                            colors.fill
                          )}
                          style={{
                            height: `${heightPx}px`,
                            minHeight: item.value > 0 ? "4px" : "0",
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500  font-medium text-center truncate w-full">
                        {item.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-center">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatCurrency(item.value)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
