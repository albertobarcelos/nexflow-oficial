import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Phone, Mail, MessageSquare, Calendar, CheckSquare, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NexflowCard } from "@/types/nexflow";
import { CardStepAction } from "@/types/nexflow";
import { Database } from "@/types/database";

type StepActionRow = Database["nexflow"]["Tables"]["step_actions"]["Row"];

interface ProcessWithAction extends CardStepAction {
  stepAction: StepActionRow | null;
}

interface ProcessTimelineProps {
  processes: ProcessWithAction[];
  selectedProcessId: string | null;
  onSelectProcess: (processId: string) => void;
  card: NexflowCard;
}

const getActionIcon = (actionType: string | null) => {
  switch (actionType) {
    case "phone_call":
      return Phone;
    case "email":
      return Mail;
    case "linkedin_message":
    case "whatsapp":
      return MessageSquare;
    case "meeting":
      return Calendar;
    case "task":
      return CheckSquare;
    default:
      return List;
  }
};

export function ProcessTimeline({
  processes,
  selectedProcessId,
  onSelectProcess,
  card,
}: ProcessTimelineProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "upcoming">("timeline");

  // Agrupar processos por dia (day_offset)
  const processesByDay = useMemo(() => {
    const grouped: Record<number, ProcessWithAction[]> = {};

    processes.forEach((process) => {
      const dayOffset = process.stepAction?.day_offset ?? 1;
      if (!grouped[dayOffset]) {
        grouped[dayOffset] = [];
      }
      grouped[dayOffset].push(process);
    });

    // Ordenar por day_offset e depois por position
    return Object.entries(grouped)
      .map(([day, procs]) => ({
        day: parseInt(day, 10),
        processes: procs.sort((a, b) => {
          const posA = a.stepAction?.position ?? 0;
          const posB = b.stepAction?.position ?? 0;
          return posA - posB;
        }),
      }))
      .sort((a, b) => a.day - b.day);
  }, [processes]);

  // Calcular data base (created_at do card)
  const cardCreatedAt = useMemo(() => {
    if (!card?.createdAt) {
      return new Date(); // Fallback para data atual se não houver createdAt
    }
    return new Date(card.createdAt);
  }, [card?.createdAt]);

  // Calcular data agendada para um processo
  const getScheduledDate = (process: ProcessWithAction) => {
    if (process.scheduledDate) {
      return new Date(process.scheduledDate);
    }
    const dayOffset = process.stepAction?.day_offset ?? 1;
    const scheduledDate = new Date(cardCreatedAt);
    scheduledDate.setDate(scheduledDate.getDate() + dayOffset - 1);
    return scheduledDate;
  };

  // Obter todos os dias únicos
  const allDays = useMemo(() => {
    const days = new Set<number>();
    processesByDay.forEach((group) => {
      days.add(group.day);
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [processesByDay]);

  return (
    <aside className="w-80 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 z-10 transition-colors duration-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Process Flow</h1>
        <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            activeTab === "timeline"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-slate-50 dark:bg-slate-800/50"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            activeTab === "upcoming"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-slate-50 dark:bg-slate-800/50"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          Upcoming
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "timeline" ? (
          <div className="flex h-full">
            {/* Coluna de Dias */}
            <div className="w-12 flex flex-col items-center bg-slate-50 dark:bg-slate-800/30 border-r border-gray-200 dark:border-gray-700 py-4 space-y-2 text-xs font-medium text-slate-400 dark:text-slate-500">
              <span className="text-[10px] uppercase tracking-wider mb-2">Day</span>
              {allDays.map((day) => {
                const isActive = processesByDay.some(
                  (group) => group.day === day && group.processes.some((p) => p.id === selectedProcessId)
                );
                const hasCompleted = processesByDay
                  .find((g) => g.day === day)
                  ?.processes.every((p) => p.status === "completed");
                
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const firstProcess = processesByDay
                        .find((g) => g.day === day)
                        ?.processes[0];
                      if (firstProcess) {
                        onSelectProcess(firstProcess.id);
                      }
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isActive
                        ? "bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm"
                        : hasCompleted
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
              <div className="border-t border-gray-200 dark:border-gray-700 w-6 my-2"></div>
              <button className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors">
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Lista de Atividades */}
            <div className="flex-1 py-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span>Activity</span>
                <span>Done</span>
              </div>

              {processesByDay.map(({ day, processes: dayProcesses }) => (
                <div key={day}>
                  {dayProcesses.map((process) => {
                    const isSelected = process.id === selectedProcessId;
                    const isCompleted = process.status === "completed";
                    const Icon = getActionIcon(process.stepAction?.action_type ?? null);
                    const scheduledDate = getScheduledDate(process);
                    const timeStr = format(scheduledDate, "HH:mm", { locale: ptBR });
                    const dayStr = `Day ${day}`;

                    return (
                      <div
                        key={process.id}
                        onClick={() => onSelectProcess(process.id)}
                        className={cn(
                          "group flex items-start px-3 py-3 cursor-pointer border-l-4 transition-colors",
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-400"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent"
                        )}
                      >
                        <div className={cn("mt-0.5 mr-3", isCompleted ? "text-green-500 dark:text-green-400" : isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm leading-tight",
                              isCompleted
                                ? "text-slate-500 dark:text-slate-500 line-through"
                                : isSelected
                                ? "font-medium text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {process.stepAction?.title || "Processo sem título"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {dayStr} • {timeStr}
                          </p>
                        </div>
                        {isCompleted ? (
                          <div className="text-indigo-600 dark:text-indigo-400 ml-2">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            className="ml-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-700 dark:border-slate-600 h-4 w-4"
                            checked={false}
                            onChange={(e) => {
                              e.stopPropagation();
                              // TODO: Implementar toggle de status
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upcoming view em desenvolvimento
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
