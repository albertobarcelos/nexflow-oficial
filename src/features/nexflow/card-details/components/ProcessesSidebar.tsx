import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { NexflowCard, CardStepAction } from "@/types/nexflow";
import type { Database, Json } from "@/types/database";
import { Phone, Mail, Calendar as CalendarIconProcess, CheckSquare, List, MessageSquare } from "lucide-react";

type StepActionRow = {
  id: string;
  step_id: string;
  day_offset: number;
  position: number;
  title: string;
  action_type: string;
  description?: string | null;
  script_template?: string | null;
  checklist_items: string[] | null;
  is_required: boolean;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

interface ProcessWithAction extends CardStepAction {
  stepAction: StepActionRow | null;
}

interface ProcessesSidebarProps {
  card: NexflowCard | null;
  selectedProcessId: string | null;
  onSelectProcess: (processId: string) => void;
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
      return CalendarIconProcess;
    case "task":
      return CheckSquare;
    default:
      return List;
  }
};

export function ProcessesSidebar({ 
  card, 
  selectedProcessId, 
  onSelectProcess 
}: ProcessesSidebarProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  const toggleDay = (day: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const { data: cardStepActions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ["nexflow", "card_step_actions", card?.id],
    enabled: Boolean(card?.id),
    queryFn: async (): Promise<CardStepAction[]> => {
      if (!card?.id) return [];

      const { data, error } = await (nexflowClient() as any)
        .from("card_step_actions")
        .select("*")
        .eq("card_id", card.id)
        .order("scheduled_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data) return [];

      return data.map((row) => ({
        id: row.id,
        cardId: row.card_id,
        stepActionId: row.step_action_id,
        stepId: row.step_id,
        status: row.status as CardStepAction["status"],
        scheduledDate: row.scheduled_date,
        completedAt: row.completed_at,
        completedBy: row.completed_by,
        notes: row.notes,
        executionData: (row.execution_data as Record<string, Json | undefined>) || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });

  const stepActionIds = useMemo(
    () => cardStepActions.map((csa) => csa.stepActionId).filter(Boolean),
    [cardStepActions]
  );

  const { data: stepActions = [], isLoading: isLoadingStepActions } = useQuery({
    queryKey: ["nexflow", "step_actions", "by-ids", stepActionIds],
    enabled: stepActionIds.length > 0,
    queryFn: async (): Promise<StepActionRow[]> => {
      if (stepActionIds.length === 0) return [];

      const { data, error } = await (nexflowClient() as any)
        .from("step_actions")
        .select("*")
        .in("id", stepActionIds);

      if (error) throw error;
      if (!data) return [];

      return data as StepActionRow[];
    },
  });

  const processesWithActions: ProcessWithAction[] = useMemo(() => {
    const stepActionsMap = new Map<string, StepActionRow>(
      stepActions.map((sa) => [sa.id, sa] as [string, StepActionRow])
    );
    return cardStepActions.map((csa) => ({
      ...csa,
      stepAction: stepActionsMap.get(csa.stepActionId) || null,
    }));
  }, [cardStepActions, stepActions]);

  const processesByDay = useMemo(() => {
    const grouped: Record<number, ProcessWithAction[]> = {};

    processesWithActions.forEach((process) => {
      const dayOffset = process.stepAction?.day_offset ?? 1;
      if (!grouped[dayOffset]) {
        grouped[dayOffset] = [];
      }
      grouped[dayOffset].push(process);
    });

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
  }, [processesWithActions]);

  // Usar ref para rastrear os dias anteriores e evitar loop infinito
  const previousDaysRef = useRef<string>('');

  // Calcular string estável dos dias baseada em processesWithActions
  const dayValuesKey = useMemo(() => {
    const days = new Set<number>();
    processesWithActions.forEach((process) => {
      const dayOffset = process.stepAction?.day_offset ?? 1;
      days.add(dayOffset);
    });
    return Array.from(days).sort((a, b) => a - b).join(',');
  }, [
    // Dependência estável: usar os IDs e day_offset dos processos
    processesWithActions.length,
    processesWithActions.map(p => `${p.id}:${p.stepAction?.day_offset ?? 1}`).sort().join('|')
  ]);

  useEffect(() => {
    if (dayValuesKey) {
      // Só atualiza se os dias realmente mudaram (comparação por valor, não por referência)
      if (previousDaysRef.current !== dayValuesKey) {
        previousDaysRef.current = dayValuesKey;
        const newDays = new Set(dayValuesKey.split(',').map(Number));
        
        setExpandedDays((prev) => {
          const prevDays = new Set(prev);
          
          // Só atualiza se os dias realmente mudaram
          if (
            newDays.size !== prevDays.size ||
            ![...newDays].every(day => prevDays.has(day))
          ) {
            return newDays;
          }
          return prev;
        });
      }
    }
  }, [dayValuesKey]);

  const cardCreatedAt = useMemo(() => {
    if (!card?.createdAt) {
      return new Date();
    }
    return new Date(card.createdAt);
  }, [card?.createdAt]);

  const getScheduledDate = (process: ProcessWithAction) => {
    if (process.scheduledDate) {
      return new Date(process.scheduledDate);
    }
    const dayOffset = process.stepAction?.day_offset ?? 1;
    const scheduledDate = new Date(cardCreatedAt);
    scheduledDate.setDate(scheduledDate.getDate() + dayOffset - 1);
    return scheduledDate;
  };

  const getStatusBadge = (status: CardStepAction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800  ">
            Concluído
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800  ">
            Em andamento
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800  ">
            Pendente
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800  ">
            Pulado
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoadingActions || isLoadingStepActions) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (processesByDay.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 px-4">
        <p className="text-xs text-gray-500  text-center">
          Nenhum processo encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto custom-scrollbar h-full">
      {processesByDay.map(({ day, processes: dayProcesses }) => {
        const isExpanded = expandedDays.has(day);
        const hasCompleted = dayProcesses.every((p) => p.status === "completed");
        
        return (
          <div key={day} className="border border-gray-200  rounded-lg overflow-hidden bg-white ">
            <button
              onClick={() => toggleDay(day)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 bg-gray-50  hover:bg-gray-100 :bg-gray-700 transition-colors",
                isExpanded && "border-b border-gray-200 "
              )}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 " />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 " />
                )}
                <h3 className="text-xs font-semibold text-gray-700  uppercase tracking-wide">
                  Dia {day}
                </h3>
                {hasCompleted && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 " />
                )}
              </div>
              <span className="text-[10px] text-gray-500 ">
                {dayProcesses.length} {dayProcesses.length === 1 ? "atividade" : "atividades"}
              </span>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-2">
                    {dayProcesses.map((process) => {
                      const isCompleted = process.status === "completed";
                      const Icon = getActionIcon(process.stepAction?.action_type ?? null);
                      const scheduledDate = getScheduledDate(process);
                      const dateStr = format(scheduledDate, "dd/MM", { locale: ptBR });
                      const timeStr = format(scheduledDate, "HH:mm", { locale: ptBR });
                      const isSelected = process.id === selectedProcessId;
                      
                      return (
                        <div
                          key={process.id}
                          onClick={() => onSelectProcess(process.id)}
                          className={cn(
                            "px-3 py-2.5 rounded-lg border transition-colors cursor-pointer",
                            isSelected
                              ? "bg-blue-50  border-blue-500  shadow-sm"
                              : isCompleted
                              ? "bg-green-50  border-green-200 "
                              : "bg-white  border-gray-200  hover:border-blue-300 :border-blue-600"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                "mt-0.5 shrink-0",
                                isCompleted
                                  ? "text-green-600 "
                                  : "text-gray-400 "
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-xs font-medium leading-tight mb-1",
                                  isCompleted
                                    ? "text-gray-500  line-through"
                                    : "text-gray-900 "
                                )}
                              >
                                {process.stepAction?.title || "Processo sem título"}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-gray-500 ">
                                  {dateStr} • {timeStr}
                                </span>
                                {getStatusBadge(process.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

