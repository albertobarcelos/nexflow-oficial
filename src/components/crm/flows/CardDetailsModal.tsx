import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Loader2,
  Save,
  Sparkles,
  Trash2,
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

export interface CardFormValues {
  title: string;
  fields: Record<string, string>;
  checklist: Record<string, Record<string, boolean>>;
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

  // Valores iniciais do formulário
  const initialValues = useMemo((): CardFormValues => {
    if (!card) {
      return { title: "", fields: {}, checklist: {} };
    }
    return {
      title: card.title,
      fields: (card.fieldValues as Record<string, string>) ?? {},
      checklist: (card.checklistProgress as Record<string, Record<string, boolean>>) ?? {},
    };
  }, [card]);

  const form = useForm<CardFormValues>({
    defaultValues: initialValues,
    mode: "onChange",
    values: initialValues, // Sincroniza quando card muda
  });

  const { isDirty } = form.formState;

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
    if (field.fieldType === "checklist") {
      const items = field.configuration.items ?? [];
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
            {field.isRequired && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-slate-400">Sem itens configurados.</p>
          ) : (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3">
              {items.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 transition-colors hover:text-slate-900"
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
            {field.isRequired && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !parsedValue && "text-slate-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
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
      );
    }

    if (field.configuration.variant === "long") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
            {field.isRequired && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </div>
          <Textarea
            rows={3}
            placeholder={(field.configuration.placeholder as string) ?? ""}
            className="resize-none"
            {...form.register(`fields.${field.id}`)}
          />
        </div>
      );
    }

    // CPF/CNPJ com máscara
    if (field.configuration.validation === "cnpj_cpf") {
      const cnpjCpfType = (field.configuration.cnpjCpfType as "auto" | "cpf" | "cnpj") ?? "auto";
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
            {field.isRequired && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </div>
          <Input
            placeholder={(field.configuration.placeholder as string) ?? ""}
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
          />
          {form.formState.errors.fields?.[field.id] && (
            <p className="text-xs text-red-500">
              {form.formState.errors.fields?.[field.id]?.message as string}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-700">{field.label}</Label>
          {field.isRequired && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
              Obrigatório
            </span>
          )}
        </div>
        <Input
          type={field.fieldType === "number" ? "number" : "text"}
          placeholder={(field.configuration.placeholder as string) ?? ""}
          {...form.register(`fields.${field.id}`)}
        />
      </div>
    );
  };

  // Handler para salvar manualmente
  const handleSave = useCallback(async () => {
    if (!card || saveStatus === "saving") return;

    setSaveStatus("saving");
    try {
      const values = form.getValues();
      await onSave(card, values);
      setSaveStatus("saved");
      form.reset(values);
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

  if (!card) {
    return null;
  }

  return (
    <Dialog open={Boolean(card)} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[900px] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-3xl border-slate-200 p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* DialogTitle para acessibilidade (visualmente oculto) */}
        <DialogTitle className="sr-only">
          Detalhes do Card: {card.title}
        </DialogTitle>

        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Card
                </p>
                <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
                  {card.title}
                </h2>
                {currentStep ? (
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: currentStep.color }}
                    />
                    {currentStep.title}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Indicador de status */}
              <AnimatePresence mode="wait">
                {saveStatus === "saving" && (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Salvando...
                  </motion.div>
                )}
                {saveStatus === "saved" && (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600"
                  >
                    <Cloud className="h-3 w-3" />
                    Salvo
                  </motion.div>
                )}
                {isDirty && saveStatus === "idle" && (
                  <motion.div
                    key="unsaved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Não salvo
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[0.3fr_0.7fr]">
            {/* Timeline (Esquerda - 30%) */}
            <div className="flex h-full flex-col overflow-hidden border-b border-slate-100 bg-slate-50/50 md:border-b-0 md:border-r">
              {/* Header Fixo */}
              <div className="shrink-0 border-b border-slate-100 px-4 py-4 md:px-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Histórico de etapas
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Contexto das etapas concluídas
                </p>
              </div>
              {/* Área de Scroll */}
              <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
                {timelineSteps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <Sparkles className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      Card recém-criado
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Criado em{" "}
                      {format(new Date(card.createdAt), "dd MMM yyyy, HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ) : (
                  <ul className="relative space-y-4">
                    {/* Linha vertical */}
                    <span className="absolute bottom-0 left-[5px] top-2 w-[2px] bg-gradient-to-b from-slate-300 to-slate-200" />
                    {timelineSteps.map(({ entry, step }) => (
                      <li key={entry.id} className="relative pl-6">
                        {/* Círculo */}
                        <div
                          className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm"
                          style={{
                            backgroundColor: step?.color ?? "#94a3b8",
                          }}
                        />
                        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className="text-sm font-medium"
                              style={{ color: step?.color ?? "#334155" }}
                            >
                              {step?.title ?? "Etapa"}
                            </p>
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {format(new Date(entry.movedAt), "dd/MM HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          {step?.fields?.length ? (
                            <div className="mt-2 space-y-2 border-t border-slate-50 pt-2">
                              {step.fields.map((field) => (
                                <div key={field.id}>
                                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
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

                {/* Sub-cards info */}
                {(subtaskCount > 0 || card.parentCardId) && (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-3">
                    {subtaskCount > 0 && (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">
                          {subtaskCount} sub-card{subtaskCount > 1 ? "s" : ""}
                        </span>{" "}
                        vinculado{subtaskCount > 1 ? "s" : ""}
                      </p>
                    )}
                    {card.parentCardId && (
                      <p className="mt-1 text-xs text-slate-500">
                        Pertence a:{" "}
                        <span className="font-medium text-slate-700">
                          {parentTitle ?? "outro card"}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Formulário (Direita - 70%) */}
            <div className="relative flex h-full max-h-full flex-col overflow-hidden bg-white">
              {/* Área de Scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                <div className="space-y-5">
                  {/* Título */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Título do card
                    </Label>
                    <Input
                      {...form.register("title")}
                      className="text-base font-medium text-slate-900"
                    />
                  </div>

                  {/* Campos da etapa atual */}
                  {currentStep?.fields?.length ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: currentStep.color }}
                        />
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Campos da etapa: {currentStep.title}
                        </p>
                      </div>
                      <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
                        {currentStep.fields.map((field) => (
                          <div key={field.id}>{renderEditableField(field)}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                      <p className="text-sm text-slate-500">
                        Nenhum campo configurado nesta etapa.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer com botões */}
              <div className="z-10 shrink-0 border-t border-slate-100 bg-white px-4 py-3 md:px-6 md:py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {/* Lado Esquerdo: Deletar e Salvar */}
                  <div className="flex items-center gap-2">
                    {/* Botão Deletar */}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Deletar
                      </Button>
                    )}
                    {/* Botão Salvar */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSave}
                      disabled={!isDirty || saveStatus === "saving"}
                      className={cn(
                        "gap-2 border-slate-300 transition-all",
                        isDirty && saveStatus === "idle" && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      )}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar alterações
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Lado Direito: Retornar e Mover */}
                  <div className="flex items-center gap-2">
                    {/* Botão Retornar Etapa */}
                    {previousStep && onUpdateCard && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleMoveBack}
                        disabled={isMoving || !previousStep}
                        className="gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Retornar para {previousStep.title}
                      </Button>
                    )}
                    {/* Botão Mover */}
                    <Button
                      type="button"
                      onClick={handleMoveNext}
                      disabled={isMoveDisabled || isMoving || !nextStep}
                      className={cn(
                        "gap-2 text-sm font-medium shadow-lg transition-all duration-200",
                        isMoveDisabled || !nextStep
                          ? "bg-slate-100 text-slate-400"
                          : "text-white hover:brightness-110"
                      )}
                      style={
                        !isMoveDisabled && nextStep
                          ? {
                              backgroundColor: nextStep.color ?? currentStep?.color ?? "#3b82f6",
                            }
                          : undefined
                      }
                    >
                      {isMoving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Movendo...
                        </>
                      ) : nextStep ? (
                        <>
                          Mover para {nextStep.title}
                          <ChevronRight className="h-4 w-4" />
                        </>
                      ) : (
                        "Última etapa"
                      )}
                    </Button>
                  </div>
                </div>
                {isMoveDisabled && nextStep && !isMoving && (
                  <p className="mt-2 text-center text-xs text-amber-600 sm:text-right">
                    Preencha os campos obrigatórios para avançar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
