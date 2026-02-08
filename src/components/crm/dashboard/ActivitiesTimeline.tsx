import {
  History,
  CheckCircle,
  Ban,
  ArrowRight,
  PlusCircle,
  CalendarPlus,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RecentActivity,
  RecentActivityType,
} from "@/hooks/useRecentActivities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivitiesTimelineUser {
  id: string;
  name: string;
  surname: string;
}

interface ActivitiesTimelineProps {
  activities: RecentActivity[];
  isLoading?: boolean;
  /** Contagem para o badge "Hoje: N" (ex.: atividades de hoje) */
  todayCount?: number;
  /** Lista de usuários para o filtro (apenas atividades) */
  users: ActivitiesTimelineUser[];
  selectedUserId?: string | null;
  onUserIdChange?: (userId: string | null) => void;
  onVerTodas?: () => void;
}

function getTypeConfig(
  type: RecentActivityType
): {
  icon: typeof CheckCircle;
  label: string;
  bgClass: string;
  iconClass: string;
} {
  switch (type) {
    case "card_created":
      return {
        icon: PlusCircle,
        label: "Card criado",
        bgClass: "bg-blue-100 ",
        iconClass: "text-blue-600 ",
      };
    case "completed":
      return {
        icon: CheckCircle,
        label: "Completo",
        bgClass: "bg-green-100 ",
        iconClass: "text-green-600 ",
      };
    case "cancelled":
      return {
        icon: Ban,
        label: "Cancelado",
        bgClass: "bg-red-100 ",
        iconClass: "text-red-600 ",
      };
    case "in_progress":
      return {
        icon: ArrowRight,
        label: "Em progresso",
        bgClass: "bg-purple-100 ",
        iconClass: "text-purple-600 ",
      };
    case "activity_created":
      return {
        icon: CalendarPlus,
        label: "Atividade criada",
        bgClass: "bg-amber-100 ",
        iconClass: "text-amber-600 ",
      };
    case "activity_completed":
      return {
        icon: CheckCircle,
        label: "Atividade concluída",
        bgClass: "bg-green-100 ",
        iconClass: "text-green-600 ",
      };
    case "activity_updated":
      return {
        icon: Pencil,
        label: "Atividade atualizada",
        bgClass: "bg-slate-100 ",
        iconClass: "text-slate-600 ",
      };
    default:
      return {
        icon: ArrowRight,
        label: "Em progresso",
        bgClass: "bg-purple-100 ",
        iconClass: "text-purple-600 ",
      };
  }
}

function formatValue(value: number | null): string {
  if (value == null || value === 0) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ActivitiesTimeline({
  activities,
  isLoading,
  todayCount = 0,
  users,
  selectedUserId,
  onUserIdChange,
  onVerTodas,
}: ActivitiesTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-white  rounded-xl shadow-sm border border-border-light  flex flex-col h-full overflow-hidden">
        <div className="p-5 border-b border-border-light  bg-gray-50 ">
          <div className="h-6 bg-gray-200  rounded w-32 mb-4" />
          <div className="h-9 bg-gray-200  rounded w-full" />
        </div>
        <div className="flex-1 p-5 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="pl-6 border-l border-slate-200 "
            >
              <div className="h-4 bg-gray-200  rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100  rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-border-light  flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-border-light  bg-gray-50 ">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800  flex items-center gap-2">
              <History className="h-5 w-5 text-primary-orange" />
              Atividades
            </h2>
            <span className="text-xs bg-white  px-2 py-1 rounded border border-slate-200  text-slate-500 ">
              Hoje: {todayCount}
            </span>
          </div>
          <Select
            value={selectedUserId ?? "all"}
            onValueChange={(v) => onUserIdChange?.(v === "all" ? null : v)}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs border-slate-200 ">
              <SelectValue placeholder="Todos os usuários" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} {user.surname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar p-5 space-y-6 min-h-0 min-w-0">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500  text-center py-6">
            Nenhuma atividade recente
          </p>
        ) : (
          activities.map((activity, index) => {
            const config = getTypeConfig(activity.type);
            const Icon = config.icon;
            const isLast = index === activities.length - 1;
            const isActivity = activity.kind === "activity";

            return (
              <div
                key={activity.id}
                className={cn(
                  "relative pl-6 pb-2 border-l border-slate-200 ",
                  isLast && "border-l-0"
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[9px] top-0 rounded-full p-0.5 border-2 border-white ",
                    config.bgClass,
                    config.iconClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5 block" />
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-700 ">
                      {config.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activity.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500  leading-relaxed">
                    <span className="font-medium text-slate-900 ">
                      {activity.responsible}
                    </span>{" "}
                    —{" "}
                    {isActivity ? (
                      <>
                        {activity.type === "activity_created"
                          ? "lançou a atividade "
                          : activity.type === "activity_completed"
                            ? "concluiu a atividade "
                            : activity.type === "activity_updated"
                              ? "atualizou a atividade "
                              : "atividade "}
                        <span className="font-medium text-slate-700 ">
                          {activity.activityTitle ?? "Atividade"}
                        </span>{" "}
                        no card{" "}
                        <span className="font-medium text-slate-700 ">
                          {activity.cardName}
                        </span>
                      </>
                    ) : (
                      <>
                        {activity.cardName}
                        {activity.value != null && activity.value > 0 && (
                          <> · {formatValue(activity.value)}</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-border-light  bg-gray-50  text-center">
        <button
          type="button"
          onClick={onVerTodas}
          className="text-xs font-medium text-primary-orange hover:text-orange-700 :text-orange-400 transition"
        >
          Ver todas as atividades
        </button>
      </div>
    </div>
  );
}
