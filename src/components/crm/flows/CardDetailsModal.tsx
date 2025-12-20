import { useMemo, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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

export interface CardFormValues {
  title: string;
  fields: Record<string, string>;
  checklist: Record<string, Record<string, boolean>>;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  assigneeType?: 'user' | 'team' | 'unassigned';
  agents?: string[];
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
    movementHistory?: CardMovementEntry[];
  }) => Promise<void>;
  subtaskCount: number;
  parentTitle?: string | null;
}

type ActiveSection = "overview" | "history" | "fields" | "attachments" | "comments";

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
}: CardDetailsModalProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isMoving, setIsMoving] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("fields");

  // Calcula a etapa atual baseado no card
  const currentStep = useMemo(() => {
    if (!card) return null;
    return steps.find((step) => step.id === card.stepId) ?? null;
  }, [card, steps]);

  const nextStep = useMemo(() => {
    if (!card) return null;
    const currentIndex = steps.findIndex((step) => step.id === card.stepId);
    if (currentIndex < 0) return null;
    return steps[currentIndex + 1] ?? null;
  }, [card, steps]);

  const previousStep = useMemo(() => {
    if (!card) return null;
    const currentIndex = steps.findIndex((step) => step.id === card.stepId);
    if (currentIndex <= 0) return null; // Primeira etapa ou não encontrada
    return steps[currentIndex - 1] ?? null;
  }, [card, steps]);

  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();

  // Valores iniciais do formulário
  const initialValues = useMemo((): CardFormValues => {
    if (!card) {
      return { title: "", fields: {}, checklist: {}, assignedTo: null, assignedTeamId: null, assigneeType: 'user', agents: [] };
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
    const history = (card.movementHistory ?? []).filter(
      (entry) => entry.toStepId !== card.stepId
    );

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
      step: stepMap.get(entry.toStepId),
    }));
  }, [card, currentStep, steps]);

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
        return <span className="text-xs text-slate-400">Checklist vazio</span>;
      }

      return (
        <ul className="mt-1.5 space-y-1">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-xs">
              <CheckCircle2
                className={cn(
                  "h-3 w-3 shrink-0",
                  progress?.[item] ? "text-emerald-500" : "text-slate-300"
                )}
              />
              <span className={progress?.[item] ? "text-slate-600" : "text-slate-400"}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    if (!rawValue) {
      return <span className="text-xs text-slate-400 italic">Não preenchido</span>;
    }

    if (field.fieldType === "date" && typeof rawValue === "string") {
      const parsed = new Date(rawValue);
      if (!Number.isNaN(parsed.getTime())) {
        return (
          <span className="text-xs text-slate-600">
            {format(parsed, "dd MMM yyyy", { locale: ptBR })}
          </span>
        );
      }
    }

    return (
      <span className="text-xs text-slate-600">
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
                const newValue = value && value.trim() ? value : null;
                form.setValue("assignedTo", newValue, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger className="block w-full appearance-none rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-4 pr-10">
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
                const newValue = value && value.trim() ? value : null;
                form.setValue("assignedTeamId", newValue, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger className="block w-full appearance-none rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 pl-4 pr-10">
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
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(field.id, item, checked === true)
                    }
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
                  onSelect={(date) => handleDateChange(field.id, date)}
                  initialFocus
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
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow resize-none"
              {...form.register(`fields.${field.id}`)}
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
                const formatted = formatCnpjCpf(e.target.value, cnpjCpfType);
                form.setValue(`fields.${field.id}`, formatted, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              onBlur={() => {
                const value = (watchFields[field.id] as string) ?? "";
                if (value && !validateCnpjCpf(value, cnpjCpfType)) {
                  form.setError(`fields.${field.id}`, {
                    type: "manual",
                    message: "CPF/CNPJ inválido",
                  });
                } else {
                  form.clearErrors(`fields.${field.id}`);
                }
              }}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow"
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
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-600 focus:ring-blue-600 sm:text-sm py-3 px-4 transition-shadow"
            {...form.register(`fields.${field.id}`)}
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
      await onUpdateCard({
        id: card.id,
        stepId: previousStep.id,
        movementHistory: [
          ...(card.movementHistory ?? []),
          {
            id: crypto.randomUUID?.() ?? `${Date.now()}`,
            fromStepId: card.stepId,
            toStepId: previousStep.id,
            movedAt: new Date().toISOString(),
            movedBy: null,
          },
        ],
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
                        <p
                          className="text-sm font-medium"
                          style={{ color: step?.color ?? "#334155" }}
                        >
                          {step?.title ?? "Etapa"}
                        </p>
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
                className="w-full max-w-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm"
              />
            </div>

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
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
              <Paperclip className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Funcionalidade de anexos será implementada em breve.
              </p>
            </div>
          </div>
        );
      case "comments":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Funcionalidade de comentários será implementada em breve.
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

  // Gerar ID do card (usando últimos caracteres do UUID)
  const cardId = card.id.split("-")[0].toUpperCase().slice(0, 4) + "-" + card.id.split("-")[1].slice(0, 4);

  return (
    <Dialog open={Boolean(card)} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[900px] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 p-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogTitle className="sr-only">Detalhes do Card: {card.title}</DialogTitle>

        <div className="flex h-full flex-col bg-white dark:bg-gray-900">
          {/* Header Redesenhado */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start shrink-0">
            <div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Card
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{card.title}</h1>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-600 font-mono">
                  #{cardId}
                </span>
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
            <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => setActiveSection("overview")}
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
                  onClick={() => setActiveSection("history")}
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
                    onClick={() => setActiveSection("fields")}
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
                  onClick={() => setActiveSection("attachments")}
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
                  onClick={() => setActiveSection("comments")}
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
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 p-8">
              <div className="max-w-3xl mx-auto">{renderSectionContent()}</div>
            </div>
          </div>

          {/* Footer Redesenhado */}
          {activeSection === "fields" && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              {onDelete && (
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
                  disabled={!isDirty || saveStatus === "saving"}
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
                {previousStep && onUpdateCard && (
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
                  disabled={isMoveDisabled || isMoving || !nextStep}
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
