import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flame, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { useUsers } from "@/hooks/useUsers";

interface CardOverviewTabProps {
  card: NexflowCard;
  currentStep: NexflowStepWithFields | null;
  subtaskCount: number;
  parentTitle?: string | null;
  /** Callback para atualizar pontos (chamas/strikes). Só presente quando o modal permite edição. */
  onUpdatePoints?: (points: number | null) => Promise<void>;
}

export function CardOverviewTab({
  card,
  currentStep,
  subtaskCount,
  parentTitle,
  onUpdatePoints,
}: CardOverviewTabProps) {
  const [pointsUpdating, setPointsUpdating] = useState(false);
  const { data: users = [] } = useUsers();

  const isFinance = card.cardType === "finance";
  const isOnboarding = card.cardType === "onboarding";
  const showPointsSection = (isFinance || isOnboarding) && onUpdatePoints;
  const currentPoints = card.points ?? 0;
  const label = isFinance ? "Chamas" : "Strikes";
  const Icon = isFinance ? Flame : AlertTriangle;

  const handleSetPoints = async (value: number) => {
    if (!onUpdatePoints) return;
    setPointsUpdating(true);
    try {
      await onUpdatePoints(value === 0 ? null : value);
    } finally {
      setPointsUpdating(false);
    }
  };
  const assignedUser = card.assignedTo
    ? users.find((user) => user.id === card.assignedTo)
    : null;

  return (
    <div className="max-w-">
      <h2 className="text-xl font-bold text-slate-800  mb-8">
        Informações do Card
      </h2>
      <div className="grid grid-cols-1 gap-10">
        <section>
          <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block">
            Título
          </label>
          <p className="text-base font-medium text-slate-700 ">
            {card.title}
          </p>
        </section>

        {currentStep && (
          <section>
            <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block">
              Etapa Atual
            </label>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentStep.color || "#10b981" }}
              />
              <span className="text-base font-medium text-slate-700 ">
                {currentStep.title}
              </span>
            </div>
          </section>
        )}

        {showPointsSection && (
          <section className="border-t border-slate-50  pt-8">
            <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </label>
            <p className="text-xs text-slate-500  mb-2">
              Selecione de 0 (nenhum) a 6
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={pointsUpdating}
                  onClick={() => handleSetPoints(n)}
                  className={cn(
                    "h-9 min-w-[2.25rem] rounded-md border text-sm font-medium transition-colors disabled:opacity-50",
                    (n === 0 ? currentPoints === 0 : currentPoints === n)
                      ? isFinance
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {n === 0 ? "0" : n}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block">
            Criado em
          </label>
          <p className="text-base font-medium text-slate-700 ">
            {format(new Date(card.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
          </p>
        </section>

        <div className="grid grid-cols-2 gap-10 border-t border-slate-50  pt-8">
          {assignedUser && (
            <section>
              <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block">
                Responsável
              </label>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200  overflow-hidden">
                  {assignedUser.avatar_url ? (
                    <img
                      alt="Avatar"
                      src={assignedUser.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-slate-600 ">
                      {assignedUser.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700 ">
                  {assignedUser.name || "Sem nome"}
                </span>
              </div>
            </section>
          )}

          {card.value && (
            <section>
              <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block">
                Valor
              </label>
              <p className="text-base font-medium text-slate-700 ">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(card.value)}
              </p>
            </section>
          )}
        </div>

        {(subtaskCount > 0 || card.parentCardId) && (
          <section className="border-t border-slate-50  pt-8">
            {subtaskCount > 0 && (
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block">
                  Sub-cards
                </label>
                <p className="text-base font-medium text-slate-700 ">
                  <span className="font-semibold">{subtaskCount}</span> sub-card
                  {subtaskCount > 1 ? "s" : ""} vinculado{subtaskCount > 1 ? "s" : ""}
                </p>
              </div>
            )}
            {card.parentCardId && (
              <div>
                <label className="text-xs font-bold text-slate-400  uppercase tracking-wider mb-2 block">
                  Card Pai
                </label>
                <p className="text-base font-medium text-slate-700 ">
                  {parentTitle ?? "Card pai"}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

