import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNexflowStepFields } from "@/hooks/useNexflowStepFields";
import { StepFieldModal } from "@/components/crm/nexflow/StepFieldModal";
import { NexflowStep, NexflowStepField } from "@/types/nexflow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, ListChecks } from "lucide-react";

interface StepConfigurationPanelProps {
  flowId: string;
  step?: NexflowStep;
  stepId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenameStep?: (name: string) => Promise<void>;
  onDeleteStep?: (stepId: string) => void;
}

export function StepConfigurationPanel({
  flowId,
  step,
  stepId,
  open,
  onOpenChange,
  onRenameStep,
  onDeleteStep,
}: StepConfigurationPanelProps) {
  const [stepName, setStepName] = useState(step?.title ?? "");
  const [isRenaming, setIsRenaming] = useState(false);
  const [fieldModalState, setFieldModalState] = useState<
    { mode: "create" | "edit"; field?: NexflowStepField } | null
  >(null);

  const activeStepId = step?.id ?? stepId ?? undefined;
  const {
    fields,
    isLoading,
    deleteField,
  } = useNexflowStepFields(activeStepId);

  useEffect(() => {
    setStepName(step?.title ?? "");
  }, [step?.id, step?.title]);

  const currentStepLabel = useMemo(() => {
    if (!step) return "Selecione uma etapa";
    return `${step.title}`;
  }, [step]);

  const handleRename = async () => {
    if (!onRenameStep || !stepName.trim() || stepName === step?.title) {
      return;
    }
    try {
      setIsRenaming(true);
      await onRenameStep(stepName.trim());
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-6 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Configurar etapa</SheetTitle>
          <SheetDescription>{currentStepLabel}</SheetDescription>
        </SheetHeader>

        {!step ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <Label htmlFor="step-name">Nome da etapa</Label>
              <Input
                id="step-name"
                value={stepName}
                onChange={(event) => setStepName(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleRename}
                  disabled={!stepName.trim() || isRenaming}
                >
                  {isRenaming ? "Salvando..." : "Salvar nome"}
                </Button>
                {onDeleteStep && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button">
                        Excluir etapa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir etapa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação removerá a etapa e todos os campos configurados nela. Deseja continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => onDeleteStep(step.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Campos da etapa</h3>
                  <p className="text-sm text-muted-foreground">
                    Crie inputs específicos para este estágio do processo.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setFieldModalState({ mode: "create" })}
                >
                  Adicionar campo
                </Button>
              </div>

              <ScrollArea className="max-h-[60vh] rounded-lg border">
                {isLoading ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((item) => (
                      <Skeleton key={item} className="h-20 w-full" />
                    ))}
                  </div>
                ) : fields.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Nenhum campo cadastrado ainda.
                  </div>
                ) : (
                  <ul className="divide-y">
    {fields.map((field) => (
                      <li
                        key={field.id}
                        className="flex items-start justify-between gap-3 p-4 hover:bg-muted/40"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {field.fieldType === "checklist"
                                ? "Checklist"
                                : "Texto"}
                            </Badge>
                            {field.isRequired && (
                              <Badge variant="secondary">Obrigatório</Badge>
                            )}
                          </div>
                          <strong className="block text-sm">
                            {field.label}
                          </strong>
                          {field.fieldType === "checklist" &&
                            field.configuration?.items && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ListChecks className="h-3 w-3" />
                                {field.configuration.items.length} itens
                              </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          onClick={() =>
                            setFieldModalState({
                              mode: "edit",
                              field,
                            })
                          }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </section>
          </>
        )}

        <StepFieldModal
          stepId={activeStepId}
          open={fieldModalState !== null}
          field={fieldModalState?.field}
          mode={fieldModalState?.mode ?? "create"}
          onOpenChange={(open) => !open && setFieldModalState(null)}
        />
      </SheetContent>
    </Sheet>
  );
}

