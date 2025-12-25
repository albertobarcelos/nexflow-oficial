import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import type {
  CardMovementEntry,
  ChecklistProgressMap,
  NexflowStepField,
  StepFieldValueMap,
} from "@/types/nexflow";
import { formatCnpjCpf, validateCnpjCpf } from "@/lib/utils/cnpjCpf";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isSystemField, SYSTEM_FIELDS } from "@/lib/flowBuilder/systemFields";
import { AgentsMultiSelect } from "./AgentsMultiSelect";

export interface StartFormPayload {
  title: string;
  fieldValues: StepFieldValueMap;
  checklistProgress: ChecklistProgressMap;
  parentCardId?: string | null;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  agents?: string[];
}

interface StartFormModalProps {
  open: boolean;
  step: NexflowStepWithFields | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: StartFormPayload) => Promise<void>;
}

type StartFormValues = {
  fields: Record<string, string | number | undefined>;
  checklist: Record<string, Record<string, boolean>>;
  agents?: string[];
};

export function StartFormModal({ open, step, onOpenChange, onSubmit }: StartFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const form = useForm<StartFormValues>({
    defaultValues: {
      fields: {},
      checklist: {},
      agents: [],
    },
  });

  const { register, control, handleSubmit, watch, setValue, reset, setError, clearErrors, formState } =
    form;

  const titleField = useMemo(() => {
    if (!step?.fields?.length) {
      return null;
    }

    const textFields = step.fields.filter((field) => field.fieldType === "text");
    if (!textFields.length) {
      return null;
    }

    const explicitTitle = textFields.find((field) =>
      field.label.toLowerCase().includes("título")
    );
    return explicitTitle ?? textFields[0];
  }, [step]);

  useEffect(() => {
    if (!step || !open) {
      reset({ fields: {}, checklist: {} });
      return;
    }

    const defaultFields: Record<string, string | number | undefined> = {};
    const defaultChecklist: Record<string, Record<string, boolean>> = {};

    step.fields?.forEach((field) => {
      if (field.fieldType === "checklist") {
        const items = field.configuration.items ?? [];
        defaultChecklist[field.id] = items.reduce(
          (acc, item) => ({
            ...acc,
            [item]: false,
          }),
          {}
        );
      } else if (field.slug !== SYSTEM_FIELDS.AGENTS) {
        // Não incluir campo agents em defaultFields
        defaultFields[field.id] = "";
      }
    });

    reset({
      fields: defaultFields,
      checklist: defaultChecklist,
      agents: [],
    });
  }, [step, open, reset]);

  const checklistWatch = watch("checklist");

  const handleInternalSubmit = handleSubmit(async (values) => {
    if (!step) {
      return;
    }

    let hasChecklistErrors = false;
    step.fields?.forEach((field) => {
      if (field.fieldType !== "checklist" || !field.isRequired) {
        return;
      }
      const items = field.configuration.items ?? [];
      const progress = values.checklist[field.id] ?? {};
      const allChecked = items.every((item) => progress[item]);

      if (!allChecked) {
        hasChecklistErrors = true;
        setError(`checklist.${field.id}` as const, {
          type: "manual",
          message: "Marque todos os itens obrigatórios",
        });
      } else {
        clearErrors(`checklist.${field.id}` as const);
      }
    });

    if (hasChecklistErrors) {
      toast.error("Complete todos os campos obrigatórios.");
      return;
    }

    const fieldValues: StepFieldValueMap = {};
    const checklistProgress: ChecklistProgressMap = {};
    let assignedTo: string | null = null;
    let assignedTeamId: string | null = null;
    let agents: string[] = values.agents ?? [];

    step.fields?.forEach((field) => {
      if (field.fieldType === "checklist") {
        const progress = values.checklist[field.id] ?? {};
        checklistProgress[field.id] = progress;
        fieldValues[field.id] = progress;
        return;
      }

      // Separar campos de sistema (assigned_to, assigned_team_id e agents) dos campos genéricos
      if (isSystemField(field.slug)) {
        if (field.slug === SYSTEM_FIELDS.ASSIGNED_TO) {
          const rawValue = values.fields[field.id];
          assignedTo = typeof rawValue === "string" && rawValue.trim() ? rawValue.trim() : null;
        }
        if (field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID) {
          const rawValue = values.fields[field.id];
          assignedTeamId = typeof rawValue === "string" && rawValue.trim() ? rawValue.trim() : null;
        }
        // Agents já está em values.agents, não precisa extrair de fields
        // Não incluir campos de sistema em fieldValues
        return;
      }

      const rawValue = values.fields[field.id];
      if (typeof rawValue === "undefined" || rawValue === "") {
        fieldValues[field.id] = undefined;
        return;
      }

      if (field.fieldType === "number") {
        const parsed = Number(rawValue);
        fieldValues[field.id] = Number.isNaN(parsed) ? undefined : parsed;
        return;
      }

      if (typeof rawValue === "string") {
        fieldValues[field.id] = rawValue.trim();
        return;
      }

      fieldValues[field.id] = rawValue;
    });

    const computedTitle = titleField
      ? `${values.fields[titleField.id] ?? ""}`.trim()
      : "";
    const title = computedTitle || step.title || "Novo card";

    // Aplicar auto-assignment: se não houver assignedTo ou assignedTeamId definidos manualmente,
    // aplicar o responsibleUserId ou responsibleTeamId da etapa
    let finalAssignedTo = assignedTo;
    let finalAssignedTeamId = assignedTeamId;
    
    if (!finalAssignedTo && !finalAssignedTeamId) {
      // Prioridade: usuário sobre time
      if (step.responsibleUserId) {
        finalAssignedTo = step.responsibleUserId;
        // Adicionar ao array agents se não estiver presente
        if (!agents.includes(step.responsibleUserId)) {
          agents = [...agents, step.responsibleUserId];
        }
      } else if (step.responsibleTeamId) {
        finalAssignedTeamId = step.responsibleTeamId;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title,
        fieldValues,
        checklistProgress,
        assignedTo: finalAssignedTo,
        assignedTeamId: finalAssignedTeamId,
        agents: agents.length > 0 ? agents : undefined,
      });
      reset({
        fields: {},
        checklist: {},
        agents: [],
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível criar o card. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const renderField = (field: NexflowStepField) => {
    if (field.fieldType === "checklist") {
      const items = field.configuration.items ?? [];
      const checklistErrors = formState.errors.checklist?.[field.id];
      return (
        <div className="space-y-2 rounded-xl border border-slate-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">{field.label}</p>
            {field.isRequired && <span className="text-xs text-red-500">Obrigatório</span>}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-slate-500">Sem itens configurados.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={Boolean(checklistWatch?.[field.id]?.[item])}
                    onCheckedChange={(checked) =>
                      setValue(`checklist.${field.id}.${item}` as const, checked === true)
                    }
                  />
                  {item}
                </label>
              ))}
            </div>
          )}
          {checklistErrors?.message ? (
            <p className="text-xs text-red-500">{checklistErrors.message}</p>
          ) : null}
        </div>
      );
    }

    if (field.fieldType === "date") {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-800">
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <Controller
            name={`fields.${field.id}` as const}
            control={control}
            rules={{
              required: field.isRequired ? "Campo obrigatório" : false,
            }}
            render={({ field: controllerField }) => {
              const dateValue =
                controllerField.value && typeof controllerField.value === "string"
                  ? new Date(controllerField.value)
                  : undefined;

              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateValue && "text-slate-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateValue ? format(dateValue, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(selectedDate) =>
                        controllerField.onChange(
                          selectedDate ? selectedDate.toISOString() : ""
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              );
            }}
          />
          {formState.errors.fields?.[field.id]?.message ? (
            <p className="text-xs text-red-500">
              {formState.errors.fields?.[field.id]?.message as string}
            </p>
          ) : null}
        </div>
      );
    }

    if (field.configuration.variant === "long") {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-800">
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <Textarea
            rows={4}
            placeholder={(field.configuration.placeholder as string) ?? ""}
            {...register(`fields.${field.id}` as const, {
              required: field.isRequired ? "Campo obrigatório" : false,
            })}
          />
          {formState.errors.fields?.[field.id]?.message ? (
            <p className="text-xs text-red-500">
              {formState.errors.fields?.[field.id]?.message as string}
            </p>
          ) : null}
        </div>
      );
    }

    // Campo Agents (multi-seleção) - campo de sistema
    if (field.slug === SYSTEM_FIELDS.AGENTS) {
      const agentsValue = watch("agents") ?? [];
      
      return (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-800">
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <AgentsMultiSelect
            value={agentsValue}
            onChange={(agentIds) => {
              setValue("agents", agentIds, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            placeholder="Selecione os responsáveis"
          />
        </div>
      );
    }

    // Campo de seleção de usuário ou time (Responsável)
    if (field.fieldType === "user_select") {
      const fieldValue = watch(`fields.${field.id}` as const);
      const isTeamField = field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID;
      const activeUsers = users.filter((user) => user.is_active);
      const activeTeams = teams.filter((team) => team.is_active);
      
      if (isTeamField) {
        // Campo de seleção de time
        return (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-800">
              {field.label}
              {field.isRequired && <span className="ml-1 text-red-500">*</span>}
            </Label>
            <Select
              value={(fieldValue as string) ?? ""}
              onValueChange={(value) => {
                setValue(`fields.${field.id}` as const, value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um time" />
              </SelectTrigger>
              <SelectContent>
                {activeTeams.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nenhum time disponível
                  </SelectItem>
                ) : (
                  activeTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {formState.errors.fields?.[field.id]?.message ? (
              <p className="text-xs text-red-500">
                {formState.errors.fields?.[field.id]?.message as string}
              </p>
            ) : null}
          </div>
        );
      }
      
      // Campo de seleção de usuário
      return (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-800">
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <Select
            value={(fieldValue as string) ?? ""}
            onValueChange={(value) => {
              setValue(`fields.${field.id}` as const, value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent>
              {activeUsers.length === 0 ? (
                <SelectItem value="" disabled>
                  Nenhum usuário disponível
                </SelectItem>
              ) : (
                activeUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} {user.surname}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {formState.errors.fields?.[field.id]?.message ? (
            <p className="text-xs text-red-500">
              {formState.errors.fields?.[field.id]?.message as string}
            </p>
          ) : null}
        </div>
      );
    }

    // CPF/CNPJ com máscara
    if (field.configuration.validation === "cnpj_cpf") {
      const cnpjCpfType = (field.configuration.cnpjCpfType as "auto" | "cpf" | "cnpj") ?? "auto";
      const fieldValue = watch(`fields.${field.id}` as const);
      return (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-800">
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <Input
            placeholder={(field.configuration.placeholder as string) ?? ""}
            value={formatCnpjCpf((fieldValue as string) ?? "", cnpjCpfType)}
            onChange={(e) => {
              const formatted = formatCnpjCpf(e.target.value, cnpjCpfType);
              setValue(`fields.${field.id}` as const, formatted, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            onBlur={() => {
              const value = (fieldValue as string) ?? "";
              if (value && !validateCnpjCpf(value, cnpjCpfType)) {
                setError(`fields.${field.id}` as const, {
                  type: "manual",
                  message: "CPF/CNPJ inválido",
                });
              } else if (!field.isRequired || value) {
                clearErrors(`fields.${field.id}` as const);
              }
            }}
          />
          {formState.errors.fields?.[field.id]?.message ? (
            <p className="text-xs text-red-500">
              {formState.errors.fields?.[field.id]?.message as string}
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-800">
          {field.label}
          {field.isRequired && <span className="ml-1 text-red-500">*</span>}
        </Label>
        <Input
          type={field.fieldType === "number" ? "number" : "text"}
          placeholder={(field.configuration.placeholder as string) ?? ""}
          {...register(`fields.${field.id}` as const, {
            required: field.isRequired ? "Campo obrigatório" : false,
          })}
        />
        {formState.errors.fields?.[field.id]?.message ? (
          <p className="text-xs text-red-500">
            {formState.errors.fields?.[field.id]?.message as string}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step?.title ?? "Novo card"}</DialogTitle>
        </DialogHeader>

        {!step ? (
          <p className="text-sm text-slate-500">
            Configure a etapa inicial para liberar o formulário de criação.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleInternalSubmit}>
            {step.fields?.length ? (
              step.fields.map((field) => (
                <div key={field.id}>
                  {renderField(field)}
                  {field.configuration.helperText ? (
                    <p className="text-xs text-slate-400 mt-1">
                      {field.configuration.helperText as string}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Nenhum campo configurado para esta etapa.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Criar card"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

