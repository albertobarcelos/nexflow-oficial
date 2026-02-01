import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCnpjCpf } from "@/lib/utils/cnpjCpf";
import type { StepHistory, StepHistoryField } from "@/hooks/useCardStepHistory";

interface StepHistoryCardProps {
  step: StepHistory;
  isCurrent?: boolean;
  isLast?: boolean;
}

function formatFieldValue(value: unknown, fieldType: string): string {
  if (value === null || value === undefined) {
    return "-";
  }

  // Array (checklist)
  if (Array.isArray(value)) {
    if (value.length === 0) return "Nenhum item";
    return value.join(", ");
  }

  // Boolean
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  // Date
  if (typeof value === "string" && fieldType === "date") {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }
    } catch {
      // Fall through to string formatting
    }
  }

  // CNPJ/CPF
  if (fieldType === "text" && typeof value === "string") {
    const formatted = formatCnpjCpf(value);
    if (formatted !== value) {
      return formatted;
    }
  }

  // String or number
  return String(value);
}

export function StepHistoryCard({ step, isCurrent = false, isLast = false }: StepHistoryCardProps) {
  const lineColor = isCurrent 
    ? "bg-indigo-500" 
    : "bg-slate-200 dark:bg-slate-700";
  
  const circleColor = isCurrent
    ? "bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/30"
    : "bg-slate-400";

  return (
    <div className="relative pl-8">
      {/* Linha vertical da timeline */}
      {!isLast && (
        <div className={cn(
          "absolute left-[3px] top-0 w-0.5",
          isLast ? "" : "bottom-[-24px]",
          lineColor
        )} />
      )}
      
      {/* Círculo indicador */}
      <div className={cn(
        "absolute left-0 top-1.5 w-2 h-2 rounded-full",
        circleColor
      )} />

      {/* Card/Accordion */}
      {isCurrent ? (
        // Etapa atual - sempre visível, sem accordion
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">ETAPA ATUAL</h3>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {step.step_name}
            </span>
            <span className="text-[10px] text-slate-400">
              {format(new Date(step.created_at), "dd/MM/yyyy", { locale: ptBR }) === format(new Date(), "dd/MM/yyyy", { locale: ptBR })
                ? "Hoje"
                : format(new Date(step.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>
      ) : (
        // Etapas históricas - formato accordion
        <details className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
          <summary className="list-none cursor-pointer p-3 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 mb-1 block uppercase">
                Etapa {step.step_position}
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {step.step_name}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-3 pb-3 pt-1 border-t border-slate-50 dark:border-slate-700/50 space-y-3">
            {step.fields.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Campos preenchidos nesta etapa...</p>
            ) : (
              step.fields.map((field) => (
                <div key={field.field_id}>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    {field.label}
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {formatFieldValue(field.value, field.field_type)}
                  </p>
                </div>
              ))
            )}
          </div>
        </details>
      )}
    </div>
  );
}
