import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Cloud,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  X,
  Info,
  History,
  FileEdit,
  Paperclip,
  MessageSquare,
  Plus,
  Tag,
  Workflow,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CardMovementEntry, NexflowCard, NexflowStepField } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { formatCnpjCpf, validateCnpjCpf } from "@/lib/utils/cnpjCpf";
import { isSystemField, SYSTEM_FIELDS, getSystemFieldValue } from "@/lib/flowBuilder/systemFields";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentsMultiSelect } from "./AgentsMultiSelect";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCardTags, useAddCardTag, useRemoveCardTag } from "@/hooks/useCardTags";
import { useFlowTags } from "@/hooks/useFlowTags";
import { useCardHistory } from "@/hooks/useCardHistory";
import { ContactFloatingWidget } from "./ContactFloatingWidget";
import { IndicationFloatingWidget } from "./IndicationFloatingWidget";
import { ParentCardWidget } from "./ParentCardWidget";
import { StepHistoryCards } from "./StepHistoryCards";
import { ProcessesView } from "./ProcessesView";
import { ProcessDetails } from "./ProcessDetails";
import { CardComments } from "./CardComments";
import { CardAttachments } from "./CardAttachments";
import { useQuery } from "@tanstack/react-query";
import { nexflowClient } from "@/lib/supabase";
import type { CardStepAction } from "@/types/nexflow";
import { Database, Json } from "@/types/database";
import { Phone, Mail, Calendar as CalendarIconProcess, CheckSquare, List } from "lucide-react";
import { useNexflowFlow } from "@/hooks/useNexflowFlows";

export interface CardFormValues {
  title: string;
  fields: Record<string, string>;
  checklist: Record<string, Record<string, boolean>>;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  assigneeType?: 'user' | 'team' | 'unassigned';
  agents?: string[];
  product?: string | null;
  value?: number | null;
}

type SaveStatus = "idle" | "saving" | "saved";

interface CardDetailsModalProps {
  card: NexflowCard | null;
  steps: NexflowStepWithFields[];
  onClose: () => void;
  onSave: (card: NexflowCard, values: CardFormValues) => Promise<void>;
  onMoveNext: (card: NexflowCard, values: CardFormValues) => Promise<void>;
  onDelete?: (cardId: string) => Promise<void>;
  onUpdateCard?: (input: {
    id: string;
    stepId?: string;
  }) => Promise<void>;
  subtaskCount: number;
  parentTitle?: string | null;
  onOpenParentCard?: (card: NexflowCard) => void;
  currentFlowId?: string; // ID do flow atual para verificar se o card está em outro flow
}

type ActiveSection = "overview" | "history" | "fields" | "attachments" | "comments" | "processes";

type StepActionRow = Database["public"]["Tables"]["step_actions"]["Row"];

interface ProcessWithAction extends CardStepAction {
  stepAction: StepActionRow | null;
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

/**
 * Componente para exibir processos na sidebar
 */
function ProcessesSidebar({ 
  card, 
  selectedProcessId, 
  onSelectProcess 
}: { 
  card: NexflowCard | null;
  selectedProcessId: string | null;
  onSelectProcess: (processId: string) => void;
}) {
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
  // Buscar card_step_actions do card
  const { data: cardStepActions = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ["nexflow", "card_step_actions", card?.id],
    enabled: Boolean(card?.id),
    queryFn: async (): Promise<CardStepAction[]> => {
      if (!card?.id) return [];

      const { data, error } = await nexflowClient()
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

  // Buscar dados completos dos step_actions
  const stepActionIds = useMemo(
    () => cardStepActions.map((csa) => csa.stepActionId).filter(Boolean),
    [cardStepActions]
  );

  const { data: stepActions = [], isLoading: isLoadingStepActions } = useQuery({
    queryKey: ["nexflow", "step_actions", "by-ids", stepActionIds],
    enabled: stepActionIds.length > 0,
    queryFn: async (): Promise<StepActionRow[]> => {
      if (stepActionIds.length === 0) return [];

      const { data, error } = await nexflowClient()
        .from("step_actions")
        .select("*")
        .in("id", stepActionIds);

      if (error) throw error;
      if (!data) return [];

      return data;
    },
  });

  // Combinar card_step_actions com step_actions
  const processesWithActions: ProcessWithAction[] = useMemo(() => {
    const stepActionsMap = new Map<string, StepActionRow>(
      stepActions.map((sa) => [sa.id, sa] as [string, StepActionRow])
    );
    return cardStepActions.map((csa) => ({
      ...csa,
      stepAction: stepActionsMap.get(csa.stepActionId) || null,
    }));
  }, [cardStepActions, stepActions]);

  // Agrupar processos por dia (day_offset)
  const processesByDay = useMemo(() => {
    const grouped: Record<number, ProcessWithAction[]> = {};

    processesWithActions.forEach((process) => {
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
  }, [processesWithActions]);

  // Expandir todos os dias por padrão quando processesByDay mudar
  useEffect(() => {
    if (processesByDay.length > 0) {
      setExpandedDays((prev) => {
        const newSet = new Set(prev);
        processesByDay.forEach(({ day }) => {
          newSet.add(day);
        });
        return newSet;
      });
    }
  }, [processesByDay]);

  // Calcular data base (created_at do card)
  const cardCreatedAt = useMemo(() => {
    if (!card?.createdAt) {
      return new Date();
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

  const getStatusBadge = (status: CardStepAction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Concluído
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Em andamento
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pendente
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
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
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
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
          <div key={day} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            <button
              onClick={() => toggleDay(day)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                isExpanded && "border-b border-gray-200 dark:border-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Dia {day}
                </h3>
                {hasCompleted && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
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
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 shadow-sm"
                    : isCompleted
                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "mt-0.5 shrink-0",
                      isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
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
                          ? "text-gray-500 dark:text-gray-400 line-through"
                          : "text-gray-900 dark:text-white"
                      )}
                    >
                      {process.stepAction?.title || "Processo sem título"}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
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

/**
 * Componente para gerenciar tags do card
 */
function CardTagsSection({ cardId, flowId }: { cardId: string; flowId: string }) {
  const { data: cardTags = [], isLoading: isLoadingCardTags } = useCardTags(cardId);
  const { data: flowTags = [], isLoading: isLoadingFlowTags } = useFlowTags(flowId);
  const addCardTag = useAddCardTag();
  const removeCardTag = useRemoveCardTag();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Filtrar tags disponíveis (tags do flow que ainda não estão no card)
  const availableTags = flowTags.filter(
    (flowTag) => !cardTags.some((cardTag) => cardTag.id === flowTag.id)
  );

  const handleAddTag = async (tagId: string) => {
    try {
      await addCardTag.mutateAsync({ cardId, tagId });
      setIsPopoverOpen(false);
    } catch (error) {
      // Erro já é tratado no hook
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeCardTag.mutateAsync({ cardId, tagId });
    } catch (error) {
      // Erro já é tratado no hook
    }
  };

  if (isLoadingCardTags || isLoadingFlowTags) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {/* Tags existentes */}
      {cardTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-xs font-medium flex items-center gap-1.5 px-2 py-0.5"
          style={{
            backgroundColor: `${tag.color}20`,
            borderColor: tag.color,
            color: tag.color,
          }}
        >
          <Tag className="h-3 w-3" />
          {tag.name}
          <button
            onClick={() => handleRemoveTag(tag.id)}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Botão para adicionar tag */}
      {availableTags.length > 0 && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2 py-0 border-dashed"
              type="button"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar tag..." />
              <CommandList>
                <CommandEmpty>Nenhuma tag disponível</CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleAddTag(tag.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Mensagem quando não há tags disponíveis */}
      {availableTags.length === 0 && flowTags.length === 0 && (
        <span className="text-xs text-gray-400 italic">
          Nenhuma tag disponível para este flow
        </span>
      )}
    </div>
  );
}

export function CardDetailsModal({
  card,
  steps,
  onClose,
  onSave,
  onMoveNext,
  onDelete,
  onUpdateCard,
  subtaskCount,
  parentTitle,
  onOpenParentCard,
  currentFlowId,
}: CardDetailsModalProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isMoving, setIsMoving] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("fields");
  const [activeTab, setActiveTab] = useState<"informacoes" | "processos">("informacoes");
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  
  // Se o card está em um flow diferente dos steps passados, buscar os steps do flow do card
  // Verificar se o step atual do card existe nos steps passados
  const cardFlowId = card?.flowId;
  const cardStepId = card?.stepId;
  const stepExistsInCurrentSteps = cardStepId ? steps.some(s => s.id === cardStepId) : false;
  const needsDifferentFlow = cardFlowId && !stepExistsInCurrentSteps;
  
  const { steps: cardFlowSteps } = useNexflowFlow(needsDifferentFlow ? cardFlowId : undefined);
  
  // Usar os steps do flow do card se necessário, senão usar os steps passados como prop
  const effectiveSteps = needsDifferentFlow && cardFlowSteps.length > 0 ? cardFlowSteps : steps;
  
  // Calcula a etapa atual baseado no card usando os steps corretos
  const currentStep = useMemo(() => {
    if (!card) return null;
    return effectiveSteps.find((step) => step.id === card.stepId) ?? null;
  }, [card, effectiveSteps]);

  const nextStep = useMemo(() => {
    if (!card) return null;
    const currentIndex = effectiveSteps.findIndex((step) => step.id === card.stepId);
    if (currentIndex < 0) return null;
    return effectiveSteps[currentIndex + 1] ?? null;
  }, [card, effectiveSteps]);

  const previousStep = useMemo(() => {
    if (!card) return null;
    const currentIndex = effectiveSteps.findIndex((step) => step.id === card.stepId);
    if (currentIndex <= 0) return null; // Primeira etapa ou não encontrada
    return effectiveSteps[currentIndex - 1] ?? null;
  }, [card, effectiveSteps]);
  
  // Para cards congelados, buscar histórico do card original (parent_card_id)
  const { data: cardHistory = [] } = useCardHistory(card?.id, card?.parentCardId);
  
  // Verificar se o card está congelado (apenas se estiver em etapa freezing)
  // Cards filhos (com parentCardId) não são automaticamente congelados
  const isFrozenCard = useMemo(() => {
    if (!card || !currentStep) return false;
    // Card é congelado apenas se estiver em etapa do tipo freezing
    return currentStep.stepType === 'freezing';
  }, [card, currentStep]);

  // Verificar se o card está em outro flow (somente leitura)
  const isReadOnly = useMemo(() => {
    if (!card || !currentFlowId) return false;
    // Se o card está em um flow diferente do flow atual, é somente leitura
    return card.flowId !== currentFlowId;
  }, [card, currentFlowId]);

  // Combinar isFrozenCard e isReadOnly para desabilitar edições
  const isDisabled = isFrozenCard || isReadOnly;

  // Buscar card_step_actions do card para exibir detalhes
  const { data: cardStepActions = [] } = useQuery({
    queryKey: ["nexflow", "card_step_actions", card?.id],
    enabled: Boolean(card?.id),
    queryFn: async (): Promise<CardStepAction[]> => {
      if (!card?.id) return [];

      const { data, error } = await nexflowClient()
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

  // Buscar dados completos dos step_actions
  const stepActionIds = useMemo(
    () => cardStepActions.map((csa) => csa.stepActionId).filter(Boolean),
    [cardStepActions]
  );

  const { data: stepActions = [] } = useQuery({
    queryKey: ["nexflow", "step_actions", "by-ids", stepActionIds],
    enabled: stepActionIds.length > 0,
    queryFn: async (): Promise<StepActionRow[]> => {
      if (stepActionIds.length === 0) return [];

      const { data, error } = await nexflowClient()
        .from("step_actions")
        .select("*")
        .in("id", stepActionIds);

      if (error) throw error;
      if (!data) return [];

      return data;
    },
  });

  // Combinar card_step_actions com step_actions
  const processesWithActions: ProcessWithAction[] = useMemo(() => {
    const stepActionsMap = new Map<string, StepActionRow>(
      stepActions.map((sa) => [sa.id, sa] as [string, StepActionRow])
    );
    return cardStepActions.map((csa) => ({
      ...csa,
      stepAction: stepActionsMap.get(csa.stepActionId) || null,
    }));
  }, [cardStepActions, stepActions]);

  // Obter processo selecionado
  const selectedProcess = useMemo(() => {
    if (!selectedProcessId) return null;
    return processesWithActions.find((p) => p.id === selectedProcessId) || null;
  }, [selectedProcessId, processesWithActions]);

  // Valores iniciais do formulário
  const initialValues = useMemo((): CardFormValues => {
    if (!card) {
      return { title: "", fields: {}, checklist: {}, assignedTo: null, assignedTeamId: null, assigneeType: 'user', agents: [], product: null, value: null };
    }
    
    // Encontrar campo "responsável" nos campos da etapa atual
    let responsavelFieldId: string | null = null;
    let responsavelTeamFieldId: string | null = null;
    let agentsFieldId: string | null = null;
    if (currentStep?.fields) {
      for (const field of currentStep.fields) {
        // Campo de responsável (usuário)
        const isResponsavelField = 
          field.fieldType === "user_select" && 
          field.slug === SYSTEM_FIELDS.ASSIGNED_TO;
        if (isResponsavelField) {
          responsavelFieldId = field.id;
        }
        
        // Campo de responsável (time)
        const isResponsavelTeamField = 
          field.fieldType === "user_select" && 
          field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID;
        if (isResponsavelTeamField) {
          responsavelTeamFieldId = field.id;
        }
        
        // Campo de responsável genérico (sem slug específico, mas com label "responsável")
        if (!responsavelFieldId && !responsavelTeamFieldId) {
          const isGenericResponsavelField = 
            field.fieldType === "user_select" && 
            field.label.toLowerCase().includes("responsável") &&
            field.slug !== SYSTEM_FIELDS.AGENTS;
          if (isGenericResponsavelField) {
            // Se não tem slug específico, assumir que é assigned_to
            responsavelFieldId = field.id;
          }
        }
        
        // Encontrar campo agents
        if (field.slug === SYSTEM_FIELDS.AGENTS) {
          agentsFieldId = field.id;
        }
      }
    }
    
    // Separar campos de sistema dos campos genéricos
    const genericFields: Record<string, string> = {};
    let extractedAssignedTo: string | null = card.assignedTo ?? null;
    let extractedAssignedTeamId: string | null = card.assignedTeamId ?? null;
    
    Object.entries((card.fieldValues as Record<string, string>) ?? {}).forEach(([key, value]) => {
      // Se for campo de sistema (slug assigned_to, assigned_team_id ou agents), não incluir em genericFields
      if (isSystemField(key)) {
        // Se o valor estiver em fieldValues com o slug, usar esse valor
        if (key === SYSTEM_FIELDS.ASSIGNED_TO && value) {
          extractedAssignedTo = value;
        }
        if (key === SYSTEM_FIELDS.ASSIGNED_TEAM_ID && value) {
          extractedAssignedTeamId = value;
        }
        return;
      }
      
      // Se for o campo "responsável time" (pelo ID do campo), extrair para assignedTeamId
      if (responsavelTeamFieldId && key === responsavelTeamFieldId && value) {
        extractedAssignedTeamId = value;
        return; // Não incluir em genericFields
      }
      
      // Se for o campo "responsável usuário" (pelo ID do campo), extrair para assignedTo
      if (responsavelFieldId && key === responsavelFieldId && value) {
        extractedAssignedTo = value;
        return; // Não incluir em genericFields
      }
      
      // Se for o campo agents (pelo ID do campo), não incluir em genericFields
      if (agentsFieldId && key === agentsFieldId) {
        return; // Não incluir em genericFields
      }
      
      genericFields[key] = value;
    });
    
    // Ler agents diretamente do card (não de fieldValues)
    const extractedAgents = card.agents ?? [];
    
    // Calcular assigneeType - se não houver nenhum, usar 'user' como padrão
    const assigneeType = extractedAssignedTo ? 'user' : extractedAssignedTeamId ? 'team' : 'user';
    
    return {
      title: card.title,
      fields: genericFields,
      checklist: (card.checklistProgress as Record<string, Record<string, boolean>>) ?? {},
      assignedTo: extractedAssignedTo,
      assignedTeamId: extractedAssignedTeamId,
      assigneeType: assigneeType,
      agents: extractedAgents,
      product: card.product ?? null,
      value: card.value ? Number(card.value) : null,
    };
  }, [card, currentStep]);

  const form = useForm<CardFormValues>({
    defaultValues: initialValues,
    mode: "onChange",
    values: initialValues, // Sincroniza quando card muda
  });

  // Resetar formulário quando card muda (especialmente assignedTeamId)
  useEffect(() => {
    if (card) {
      form.reset(initialValues);
    }
  }, [card?.id, initialValues, form]);

  // Sincronizar aba ativa com seção ativa
  useEffect(() => {
    if (activeSection === "processes") {
      setActiveTab("processos");
    } else {
      setActiveTab("informacoes");
    }
  }, [activeSection]);

  // Auto-selecionar primeiro processo quando abrir a aba de processos
  useEffect(() => {
    if (activeSection === "processes" && !selectedProcessId && processesWithActions.length > 0) {
      const firstActive = processesWithActions.find(
        (p) => p.status === "pending" || p.status === "in_progress"
      ) || processesWithActions[0];
      if (firstActive) {
        setSelectedProcessId(firstActive.id);
      }
    }
  }, [activeSection, selectedProcessId, processesWithActions]);

  const { isDirty } = form.formState;

  // Cálculo do progresso do fluxo
  const progressPercentage = useMemo(() => {
    if (!currentStep || !steps.length) return 0;
    const orderedSteps = [...steps].sort((a, b) => a.position - b.position);
    const currentIndex = orderedSteps.findIndex((s) => s.id === currentStep.id);
    if (currentIndex < 0) return 0;
    return ((currentIndex + 1) / orderedSteps.length) * 100;
  }, [currentStep, steps]);

  const timelineSteps = useMemo(() => {
    if (!card || !currentStep) {
      return [];
    }

    const orderedSteps = [...steps].sort((a, b) => a.position - b.position);
    
    // Incluir todas as entradas de histórico, incluindo a etapa atual se for conclusão/cancelamento
    // Não filtrar entradas onde entry.toStepId === card.stepId se a ação for 'complete' ou 'cancel'
    const history = cardHistory.filter((entry) => {
      if (!entry.toStepId) return false;
      
      // Sempre incluir ações de conclusão ou cancelamento, mesmo se for a etapa atual
      if (entry.actionType === 'complete' || entry.actionType === 'cancel') {
        return true;
      }
      
      // Para outras ações, incluir apenas se não for a etapa atual
      return entry.toStepId !== card.stepId;
    });

    if (history.length === 0) {
      return orderedSteps
        .filter((step) => step.position < currentStep.position)
        .map((step) => ({
          entry: {
            id: `${card.id}-${step.id}-fallback`,
            fromStepId: null,
            toStepId: step.id,
            movedAt: card.createdAt,
            movedBy: null,
          } as CardMovementEntry,
          step,
        }));
    }

    const stepMap = new Map<string, NexflowStepWithFields>();
    orderedSteps.forEach((step) => stepMap.set(step.id, step));
    return history.map((entry) => ({
      entry,
      step: entry.toStepId ? stepMap.get(entry.toStepId) : undefined,
    })).filter((item) => item.step); // Filtrar entradas sem step correspondente
  }, [card, currentStep, steps, cardHistory]);

  // Última atualização do histórico
  const lastHistoryUpdate = useMemo(() => {
    if (!card || !timelineSteps.length) return null;
    const lastEntry = timelineSteps[timelineSteps.length - 1];
    return format(new Date(lastEntry.entry.movedAt), "dd/MM", { locale: ptBR });
  }, [card, timelineSteps]);

  // Watch específico para campos
  const watchFields = form.watch("fields");
  const watchChecklist = form.watch("checklist");

  // Validação instantânea client-side baseada na etapa ATUAL
  const isMoveDisabled = useMemo(() => {
    if (!currentStep || !nextStep) {
      return true;
    }

    const requiredFields = currentStep.fields?.filter((field) => field.isRequired) ?? [];
    if (!requiredFields.length) {
      return false;
    }

    const hasInvalidField = requiredFields.some((field) => {
      if (field.fieldType === "checklist") {
        const progress = watchChecklist[field.id] ?? {};
        const items = field.configuration.items ?? [];
        const allChecked = items.every((item) => progress[item] === true);
        return !allChecked;
      }

      const value = watchFields[field.id];
      if (typeof value === "number") {
        return false;
      }

      if (typeof value === "string") {
        return value.trim().length === 0;
      }

      return !value;
    });

    return hasInvalidField;
  }, [currentStep, nextStep, watchChecklist, watchFields]);

  const renderTimelineFieldValue = (field: NexflowStepField) => {
    if (!card) return null;
    const rawValue = card.fieldValues[field.id];

    if (field.fieldType === "checklist") {
      const progress = (card.checklistProgress?.[field.id] as Record<string, boolean>) ?? {};
      const items = field.configuration.items ?? [];
      if (!items.length) {
        return <span className="text-xs text-neutral-400">Checklist vazio</span>;
      }

      return (
        <ul className="mt-1.5 space-y-1">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-xs">
              <CheckCircle2
                className={cn(
                  "h-3 w-3 shrink-0",
                  progress?.[item] ? "text-emerald-500" : "text-neutral-300"
                )}
              />
              <span className={progress?.[item] ? "text-neutral-600" : "text-neutral-400"}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    if (!rawValue) {
      return <span className="text-xs text-neutral-400 italic">Não preenchido</span>;
    }

    if (field.fieldType === "date" && typeof rawValue === "string") {
      const parsed = new Date(rawValue);
      if (!Number.isNaN(parsed.getTime())) {
        return (
          <span className="text-xs text-neutral-600">
            {format(parsed, "dd MMM yyyy", { locale: ptBR })}
          </span>
        );
      }
    }

    return (
      <span className="text-xs text-neutral-600">
        {typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue)}
      </span>
    );
  };

  // Handler para checkbox com shouldDirty e shouldValidate
  const handleCheckboxChange = useCallback(
    (fieldId: string, item: string, checked: boolean) => {
      form.setValue(`checklist.${fieldId}.${item}`, checked, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    },
    [form]
  );

  // Handler para date com shouldDirty e shouldValidate
  const handleDateChange = useCallback(
    (fieldId: string, date: Date | undefined) => {
      form.setValue(`fields.${fieldId}`, date ? date.toISOString() : "", {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      });
    },
    [form]
  );

  const renderEditableField = (field: NexflowStepField) => {
    // Campo Agents (multi-seleção) - campo de sistema
    // PRIORIDADE: Verificar agents ANTES de assigned_to
    // Verifica por slug ou por label contendo "agents" ou "agentes" (case insensitive)
    const isAgentsField = 
      field.slug === SYSTEM_FIELDS.AGENTS ||
      (field.fieldType === "user_select" && 
       field.label.toLowerCase().includes("agents")) ||
      (field.fieldType === "user_select" && 
       field.label.toLowerCase().includes("agentes"));
    
    if (isAgentsField) {
      const agentsValue = form.watch("agents") ?? [];
      
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <AgentsMultiSelect
            value={agentsValue}
            onChange={(agentIds) => {
              form.setValue("agents", agentIds, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            placeholder="Selecione os responsáveis"
          />
        </div>
      );
    }
    
    // Campo de seleção de responsável (User) - campo de sistema
    // Verifica se é user_select com slug assigned_to OU label contém "Responsável" (mas não assigned_team_id)
    // IMPORTANTE: Excluir explicitamente agents e assigned_team_id para evitar conflito
    const isAssignedToField = 
      field.fieldType === "user_select" && 
      field.slug !== SYSTEM_FIELDS.AGENTS &&
      field.slug !== SYSTEM_FIELDS.ASSIGNED_TEAM_ID &&
      !field.label.toLowerCase().includes("agents") &&
      !field.label.toLowerCase().includes("agentes") &&
      (field.slug === SYSTEM_FIELDS.ASSIGNED_TO ||
       (field.label.toLowerCase().includes("responsável") && field.slug !== SYSTEM_FIELDS.ASSIGNED_TEAM_ID));
    
    if (isAssignedToField) {
      // Campo de responsável mostra apenas usuários
      const assignedToValue = form.watch("assignedTo");
      const activeUsers = users.filter((user) => user.is_active);
      
      const selectedUser = assignedToValue 
        ? activeUsers.find((user) => user.id === assignedToValue)
        : null;
      
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          
          {/* Seletor de Usuário */}
          <div className="relative">
            <Select
              value={assignedToValue ?? undefined}
              onValueChange={(value) => {
                if (!isDisabled) {
                  const newValue = value && value.trim() ? value : null;
                  form.setValue("assignedTo", newValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isDisabled}
            >
              <SelectTrigger className="block w-full appearance-none rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-4 pr-10 disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder="Selecione um usuário">
                  {selectedUser ? `${selectedUser.name} ${selectedUser.surname}` : "Selecione um usuário"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeUsers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    Nenhum usuário disponível
                  </div>
                ) : (
                  activeUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.surname}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      );
    }
    
    // Campo de seleção de time - campo de sistema
    // Verifica se é user_select com slug assigned_team_id OU label contém "time" (mas não "responsável")
    // IMPORTANTE: Excluir explicitamente agents e assigned_to para evitar conflito
    const fieldLabelLower = field.label.toLowerCase();
    const isTeamField = 
      field.fieldType === "user_select" && 
      field.slug !== SYSTEM_FIELDS.AGENTS &&
      field.slug !== SYSTEM_FIELDS.ASSIGNED_TO &&
      !fieldLabelLower.includes("agents") &&
      !fieldLabelLower.includes("agentes") &&
      !fieldLabelLower.includes("responsável") &&
      (field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID ||
       fieldLabelLower === "time" ||
       (fieldLabelLower.includes("time") && !fieldLabelLower.includes("responsável")));
    
    if (isTeamField) {
      // Campo de time mostra apenas times
      const assignedTeamIdValue = form.watch("assignedTeamId");
      const activeTeams = teams.filter((team) => team.is_active);
      
      const selectedTeam = assignedTeamIdValue
        ? activeTeams.find((team) => team.id === assignedTeamIdValue)
        : null;
      
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          
          {/* Seletor de Time */}
          <div className="relative">
            <Select
              value={assignedTeamIdValue ?? undefined}
              onValueChange={(value) => {
                if (!isDisabled) {
                  const newValue = value && value.trim() ? value : null;
                  form.setValue("assignedTeamId", newValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isDisabled}
            >
              <SelectTrigger className="block w-full appearance-none rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-4 pr-10 disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder="Selecione um time">
                  {selectedTeam ? selectedTeam.name : "Selecione um time"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeTeams.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    Nenhum time disponível
                  </div>
                ) : (
                  activeTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      );
    }
    
    if (field.fieldType === "checklist") {
      const items = field.configuration.items ?? [];
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          {items.length === 0 ? (
            <p className="text-xs text-gray-400">Sem itens configurados.</p>
          ) : (
            <div className="space-y-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
              {items.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-white"
                >
                  <Checkbox
                    checked={watchChecklist?.[field.id]?.[item] === true}
                    onCheckedChange={(checked) => {
                      if (!isDisabled) {
                        handleCheckboxChange(field.id, item, checked === true);
                      }
                    }}
                    disabled={isDisabled}
                  />
                  {item}
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (field.fieldType === "date") {
      const value = watchFields[field.id];
      const parsedValue =
        value && typeof value === "string" && !Number.isNaN(new Date(value).getTime())
          ? new Date(value)
          : undefined;

      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative rounded-md shadow-sm group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="text-gray-400 group-focus-within:text-blue-600 transition-colors text-lg" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-10 pr-4 transition-shadow text-left font-normal",
                    !parsedValue && "text-gray-400"
                  )}
                >
                  {parsedValue ? format(parsedValue, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parsedValue}
                  onSelect={(date) => {
                    if (!isDisabled) {
                      handleDateChange(field.id, date);
                    }
                  }}
                  initialFocus
                  disabled={isDisabled}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );
    }

    if (field.configuration.variant === "long") {
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative rounded-md shadow-sm">
            <Textarea
              rows={4}
              placeholder={(field.configuration.placeholder as string) ?? "Digite sua resposta..."}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              {...form.register(`fields.${field.id}`)}
              disabled={isDisabled}
            />
          </div>
        </div>
      );
    }

    // CPF/CNPJ com máscara
    if (field.configuration.validation === "cnpj_cpf") {
      const cnpjCpfType = (field.configuration.cnpjCpfType as "auto" | "cpf" | "cnpj") ?? "auto";
      return (
        <div>
          <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </Label>
          <div className="relative rounded-md shadow-sm">
            <Input
              placeholder={(field.configuration.placeholder as string) ?? "000.000.000-00 ou 00.000.000/0000-00"}
              value={formatCnpjCpf((watchFields[field.id] as string) ?? "", cnpjCpfType)}
              onChange={(e) => {
                if (!isDisabled) {
                  const formatted = formatCnpjCpf(e.target.value, cnpjCpfType);
                  form.setValue(`fields.${field.id}`, formatted, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
              onBlur={() => {
                if (!isDisabled) {
                  const value = (watchFields[field.id] as string) ?? "";
                  if (value && !validateCnpjCpf(value, cnpjCpfType)) {
                    form.setError(`fields.${field.id}`, {
                      type: "manual",
                      message: "CPF/CNPJ inválido",
                    });
                  } else {
                    form.clearErrors(`fields.${field.id}`);
                  }
                }
              }}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDisabled}
            />
          </div>
          {form.formState.errors.fields?.[field.id] && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.fields?.[field.id]?.message as string}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {field.label}
          {field.isRequired && (
            <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
              Obrigatório
            </span>
          )}
        </Label>
        <div className="relative rounded-md shadow-sm">
          <Input
            type={field.fieldType === "number" ? "number" : "text"}
            placeholder={(field.configuration.placeholder as string) ?? ""}
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            {...form.register(`fields.${field.id}`)}
            disabled={isFrozenCard}
          />
        </div>
      </div>
    );
  };

  // Handler para salvar manualmente
  const handleSave = useCallback(async () => {
    if (!card || saveStatus === "saving") return;

    setSaveStatus("saving");
    try {
      const values = form.getValues();
      // Garantir que assignedTo e assignedTeamId sejam sempre definidos (mesmo que null)
      const formValues: CardFormValues = {
        ...values,
        assignedTo: values.assignedTo !== undefined ? values.assignedTo : null,
        assignedTeamId: values.assignedTeamId !== undefined ? values.assignedTeamId : null,
      };
      await onSave(card, formValues);
      setSaveStatus("saved");
      form.reset(formValues);
      setTimeout(() => {
        setSaveStatus((current) => (current === "saved" ? "idle" : current));
      }, 2000);
    } catch (error) {
      console.error("[Save] Erro ao salvar:", error);
      setSaveStatus("idle");
    }
  }, [card, form, onSave, saveStatus]);

  // Handler para mover
  const handleMoveNext = useCallback(async () => {
    if (!card || !nextStep || isMoveDisabled || isMoving) {
      return;
    }

    setIsMoving(true);

    try {
      const currentValues = form.getValues();
      
      if (isDirty) {
        await onSave(card, currentValues);
      }
      
      await onMoveNext(card, currentValues);
    } catch (error) {
      console.error("[Move] Erro na movimentação:", error);
    } finally {
      setIsMoving(false);
    }
  }, [card, nextStep, isMoveDisabled, isMoving, isDirty, form, onSave, onMoveNext]);

  // Handler para retornar etapa
  const handleMoveBack = useCallback(async () => {
    if (!card || !previousStep || isMoving || !onUpdateCard) return;
    
    setIsMoving(true);
    try {
      const currentValues = form.getValues();
      if (isDirty) {
        await onSave(card, currentValues);
      }
      // Usar onUpdateCard para mudar stepId
      // O histórico será inserido automaticamente pela edge function na tabela card_history
      await onUpdateCard({
        id: card.id,
        stepId: previousStep.id,
      });
      onClose(); // Fecha modal após mover
    } catch (error) {
      console.error("[MoveBack] Erro:", error);
    } finally {
      setIsMoving(false);
    }
  }, [card, previousStep, isMoving, isDirty, form, onSave, onUpdateCard, onClose]);

  // Handler para deletar card
  const handleDelete = useCallback(async () => {
    if (!card || !onDelete) return;
    
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar o card "${card.title}"? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;
    
    try {
      await onDelete(card.id);
      onClose();
    } catch (error) {
      console.error("[Delete] Erro:", error);
    }
  }, [card, onDelete, onClose]);

  // Handler para fechar
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  // Renderização de conteúdo por seção
  const renderSectionContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Informações do Card
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Título
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">{card?.title}</p>
                </div>
                {currentStep && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Etapa Atual
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: currentStep.color }}
                      />
                      <p className="text-sm text-gray-900 dark:text-white">{currentStep.title}</p>
                    </div>
                  </div>
                )}
                {card && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Criado em
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(card.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {(subtaskCount > 0 || card?.parentCardId) && (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4">
                {subtaskCount > 0 && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">{subtaskCount}</span> sub-card
                    {subtaskCount > 1 ? "s" : ""} vinculado{subtaskCount > 1 ? "s" : ""}
                  </p>
                )}
                {card?.parentCardId && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    Pertence a: <span className="font-medium">{parentTitle ?? "outro card"}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        );
      case "history":
        return (
          <div className="space-y-4">
            {timelineSteps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Card recém-criado
                </p>
                {card && (
                  <p className="mt-1 text-xs text-gray-400">
                    Criado em{" "}
                    {format(new Date(card.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            ) : (
              <ul className="relative space-y-4">
                <span className="absolute bottom-0 left-[5px] top-2 w-[2px] bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
                {timelineSteps.map(({ entry, step }) => (
                  <li key={entry.id} className="relative pl-6">
                    <div
                      className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                      style={{ backgroundColor: step?.color ?? "#94a3b8" }}
                    />
                    <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className="text-sm font-medium"
                            style={{ color: step?.color ?? "#334155" }}
                          >
                            {entry.toStepTitle || step?.title || "Etapa"}
                          </p>
                          {/* Mostrar informação de movimentação se disponível */}
                          {entry.fromStepTitle && entry.toStepTitle && entry.fromStepTitle !== entry.toStepTitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {entry.fromStepTitle} → {entry.toStepTitle}
                            </p>
                          )}
                          {/* Mostrar quem moveu se disponível */}
                          {entry.userName && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Movido por {entry.userName}
                            </p>
                          )}
                          {/* Mostrar tipo de ação se for conclusão ou cancelamento */}
                          {entry.actionType === 'complete' && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                              ✓ Concluído
                            </p>
                          )}
                          {entry.actionType === 'cancel' && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                              ✗ Cancelado
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] text-gray-400">
                          {format(new Date(entry.movedAt), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {step?.fields?.length ? (
                        <div className="mt-3 space-y-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                          {step.fields.map((field) => (
                            <div key={field.id}>
                              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                {field.label}
                              </p>
                              {renderTimelineFieldValue(field)}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case "fields":
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStep?.color ?? "#F59E0B" }}
                />
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Etapa Atual
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentStep?.title ?? "Etapa"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Preencha os campos abaixo para avançar o card no fluxo.
              </p>
            </div>

            <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Card (Identificador)
              </Label>
            <Input
              {...form.register("title")}
              disabled={isDisabled}
              className="w-full max-w-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            </div>

            {/* Campos financeiros - apenas para cards do tipo finance */}
            {card?.cardType === 'finance' && (
              <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Informações Financeiras
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Produto
                    </Label>
                    <Input
                      {...form.register("product")}
                      disabled={isDisabled}
                      placeholder="Digite o nome do produto"
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Valor
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register("value", {
                          valueAsNumber: true,
                        })}
                        disabled={isDisabled}
                        placeholder="0,00"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-10 pr-4 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep?.fields?.length ? (
              <div className="space-y-6">
                {currentStep.fields.map((field) => (
                  <div key={field.id}>{renderEditableField(field)}</div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum campo configurado nesta etapa.
                </p>
              </div>
            )}
          </div>
        );
      case "attachments":
        return (
          <div className="space-y-4">
            <CardAttachments cardId={card.id} />
          </div>
        );
      case "comments":
        return (
          <div className="h-full">
            <CardComments cardId={card.id} />
          </div>
        );
      case "processes":
        if (!card) return null;
        if (selectedProcess) {
          return <ProcessDetails process={selectedProcess} card={card} />;
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecione um processo na sidebar para visualizar os detalhes
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!card) {
    return null;
  }

  return (
    <Dialog open={Boolean(card)} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[900px] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 p-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogTitle className="sr-only">Detalhes do Card: {card.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Visualize e edite os detalhes do card, incluindo campos, histórico e processos
        </DialogDescription>

        <div className="flex h-full flex-col bg-white dark:bg-gray-900">
          {/* Header Redesenhado */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start shrink-0">
            <div className="flex-1">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Card
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{card.title}</h1>
                {/* Widget flutuante de Lead */}
                <ContactFloatingWidget contactId={card.contactId} />
                {/* Widget flutuante de Indicação */}
                <IndicationFloatingWidget indicationId={card.indicationId} />
                {/* Widget flutuante de Card Pai */}
                <ParentCardWidget
                  parentCardId={card.parentCardId}
                  onOpenParentCard={onOpenParentCard}
                />
              </div>
              {currentStep && (
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentStep.color }}
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {currentStep.title}
                  </span>
                </div>
              )}
              <CardTagsSection cardId={card.id} flowId={card.flowId} />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Layout Principal: Sidebar + Conteúdo */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar de Navegação */}
            <div className="w-[392px] bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
              {/* Seção de Histórico de Etapas */}
              <div className="border-b border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ maxHeight: '50%', minHeight: '200px' }}>
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Histórico de Etapas
                  </h3>
                </div>
                <StepHistoryCards 
                  cardId={card?.id} 
                  currentStepId={card?.stepId} 
                />
              </div>

              {/* Navegação existente */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => {
                  const newTab = value as "informacoes" | "processos";
                  setActiveTab(newTab);
                  if (newTab === "processos") {
                    setActiveSection("processes");
                  } else {
                    // Se estiver em processos, mudar para fields, senão manter a seção atual
                    if (activeSection === "processes") {
                      setActiveSection("fields");
                    }
                  }
                }}
                className="flex flex-col h-full"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
                    <TabsTrigger 
                      value="informacoes"
                      className="text-xs font-medium"
                    >
                      Informações
                    </TabsTrigger>
                    <TabsTrigger 
                      value="processos"
                      className="text-xs font-medium"
                    >
                      Processos
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="informacoes" className="flex-1 overflow-y-auto mt-0 p-4 space-y-1">
                  <nav className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab("informacoes");
                        setActiveSection("overview");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                        activeSection === "overview"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      )}
                    >
                      {activeSection === "overview" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
                      )}
                      <Info
                        className={cn(
                          "h-5 w-5",
                          activeSection === "overview"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                        )}
                      />
                      <span>Visão Geral</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("informacoes");
                        setActiveSection("history");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                        activeSection === "history"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      )}
                    >
                      {activeSection === "history" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
                      )}
                      <History
                        className={cn(
                          "h-5 w-5",
                          activeSection === "history"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>Histórico</span>
                        {lastHistoryUpdate && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            Última atualização: {lastHistoryUpdate}
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="relative">
                      {activeSection === "fields" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
                      )}
                      <button
                        onClick={() => {
                          setActiveTab("informacoes");
                          setActiveSection("fields");
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium shadow-sm border border-gray-200 dark:border-gray-600 text-left",
                          activeSection === "fields"
                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-white"
                            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        )}
                      >
                        <FileEdit
                          className={cn(
                            "h-5 w-5",
                            activeSection === "fields"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400"
                          )}
                        />
                        <span>Campos da Etapa</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab("informacoes");
                        setActiveSection("attachments");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                        activeSection === "attachments"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      )}
                    >
                      {activeSection === "attachments" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
                      )}
                      <Paperclip
                        className={cn(
                          "h-5 w-5",
                          activeSection === "attachments"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                        )}
                      />
                      <span>Anexos</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("informacoes");
                        setActiveSection("comments");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left group relative",
                        activeSection === "comments"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      )}
                    >
                      {activeSection === "comments" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r" />
                      )}
                      <MessageSquare
                        className={cn(
                          "h-5 w-5",
                          activeSection === "comments"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 group-hover:text-blue-600 dark:text-gray-500"
                        )}
                      />
                      <span>Comentários</span>
                    </button>
                  </nav>
                </TabsContent>

                <TabsContent value="processos" className="flex-1 overflow-y-auto mt-0 p-4">
                  <ProcessesSidebar 
                    card={card} 
                    selectedProcessId={selectedProcessId}
                    onSelectProcess={setSelectedProcessId}
                  />
                </TabsContent>
              </Tabs>
              </div>

              {/* Barra de Progresso do Fluxo */}
              <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2 uppercase">
                  Progresso do Fluxo
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                  <span>Início</span>
                  <span>{Math.round(progressPercentage)}%</span>
                  <span>Fim</span>
                </div>
              </div>
            </div>

            {/* Área de Conteúdo Principal */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 p-0">
              <div className={cn(
                activeSection === "processes" ? "w-full h-full" : 
                activeSection === "comments" ? "w-full h-full" :
                "max-w-3xl mx-auto p-8"
              )}>
                {renderSectionContent()}
              </div>
            </div>
          </div>

          {/* Footer Redesenhado */}
          {activeSection === "fields" && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              {/* Mensagem de card congelado ou de outro flow */}
              {isFrozenCard && (
                <div className="w-full sm:w-auto flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-lg text-sm">
                  <Lock className="h-4 w-4" />
                  <span>Este card está congelado e não pode ser editado. Apenas visualização permitida.</span>
                </div>
              )}
              {isReadOnly && !isFrozenCard && (
                <div className="w-full sm:w-auto flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-2.5 rounded-lg text-sm">
                  <Lock className="h-4 w-4" />
                  <span>Este card pertence a outro flow e não pode ser editado aqui. Apenas visualização permitida.</span>
                </div>
              )}
              
              {onDelete && !isDisabled && (
                <button
                  onClick={handleDelete}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm text-sm font-medium"
                >
                  <Trash2 className="h-5 w-5" />
                  Deletar
                </button>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleSave}
                  disabled={isDisabled || !isDirty || saveStatus === "saving"}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Salvar alterações
                    </>
                  )}
                </button>
                {previousStep && onUpdateCard && !isDisabled && (
                  <button
                    onClick={handleMoveBack}
                    disabled={isMoving || !previousStep}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Retornar para {previousStep.title}
                  </button>
                )}
                <button
                  onClick={handleMoveNext}
                  disabled={isDisabled || isMoveDisabled || isMoving || !nextStep}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg transition-colors shadow-md shadow-teal-500/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={
                    !isMoveDisabled && nextStep
                      ? {
                          backgroundColor: nextStep.color ?? currentStep?.color ?? "#14B8A6",
                        }
                      : undefined
                  }
                >
                  {isMoving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Movendo...
                    </>
                  ) : nextStep ? (
                    <>
                      Mover para {nextStep.title}
                      <ChevronRight className="h-5 w-5" />
                    </>
                  ) : (
                    "Última etapa"
                  )}
                </button>
              </div>
              {isMoveDisabled && nextStep && !isMoving && (
                <p className="mt-2 text-center text-xs text-amber-600 sm:text-right">
                  Preencha os campos obrigatórios para avançar
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
