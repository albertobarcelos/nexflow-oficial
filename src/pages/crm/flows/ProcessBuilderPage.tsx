import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProcessSidebar } from "@/components/crm/flows/ProcessSidebar";
import { StepActionForm } from "@/components/crm/flows/StepActionForm";
import { CustomFieldsEditor } from "@/components/crm/flows/CustomFieldsEditor";
import { ChecklistEditor } from "@/components/crm/flows/ChecklistEditor";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useNexflowFlow, useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { useStepActions } from "@/hooks/useStepActions";
import { useNexflowStepFields } from "@/hooks/useNexflowStepFields";
import { NexflowStepAction } from "@/types/nexflow";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProcessBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAccess, accessError } = useClientAccessGuard();
  const { flow, isLoading: isLoadingFlow } = useNexflowFlow(id);
  const { updateFlow } = useNexflowFlows();
  const { steps, isLoading: isLoadingSteps } = useNexflowSteps(id);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [processName, setProcessName] = useState("");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [formHasUnsavedChanges, setFormHasUnsavedChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState<"navigate" | "create" | "select" | "changeStep" | null>(null);
  const [pendingSelectActionId, setPendingSelectActionId] = useState<string | null>(null);
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);
  const pendingNavigateRef = useRef<(() => void) | null>(null);
  const stepActionFormSaveRef = useRef<(() => Promise<boolean>) | null>(null);

  const { stepActions, deleteStepAction, createStepAction } = useStepActions(
    selectedStepId || undefined
  );

  // Selecionar o primeiro step por padrão
  useEffect(() => {
    if (steps.length > 0 && !selectedStepId) {
      setSelectedStepId(steps[0].id);
    }
  }, [steps, selectedStepId]);

  // Carregar nome do processo
  useEffect(() => {
    if (flow) {
      setProcessName(flow.name);
    }
  }, [flow]);

  // Verifica se há alterações não salvas (nome do processo ou formulário)
  const processNameDirty = flow ? processName.trim() !== flow.name : false;
  const hasUnsavedChanges = processNameDirty || formHasUnsavedChanges;

  // Bloqueia navegação quando há alterações não salvas
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked" && !showUnsavedDialog) {
      setPendingAction("navigate");
      pendingNavigateRef.current = () => blocker.proceed();
      setShowUnsavedDialog(true);
    }
  }, [blocker.state, showUnsavedDialog]);

  // Aviso ao fechar/recarregar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Guard: sem acesso - retornar após todos os hooks
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p className="font-medium">Sem acesso aos flows</p>
          <p className="text-sm text-muted-foreground mt-1">{accessError ?? "Cliente não definido"}</p>
        </div>
      </div>
    );
  }

  const selectedAction = stepActions.find((a) => a.id === selectedActionId) || null;
  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const canAddProcesses = selectedStep?.stepType === "standard" || !selectedStep?.stepType;

  const handleSelectAction = (actionId: string | null) => {
    if (hasUnsavedChanges && actionId !== selectedActionId) {
      setPendingAction("select");
      setPendingSelectActionId(actionId);
      setShowUnsavedDialog(true);
    } else {
      setSelectedActionId(actionId);
    }
  };

  const doCreateAction = useCallback(async () => {
    if (!selectedStepId) return;

    if (!canAddProcesses) {
      toast.error("Processos não podem ser adicionados neste tipo de etapa. Apenas etapas do tipo 'Normal' podem ter processos.");
      return;
    }

    try {
      const newAction = await createStepAction({
        stepId: selectedStepId,
        dayOffset: 1,
        title: "Nova Ação",
        actionType: "task",
        isRequired: true,
      });
      setSelectedActionId(newAction.id);
    } catch (error) {
      console.error("Erro ao criar ação:", error);
    }
  }, [selectedStepId, canAddProcesses, createStepAction]);

  const handleCreateAction = () => {
    if (hasUnsavedChanges) {
      setPendingAction("create");
      setShowUnsavedDialog(true);
    } else {
      doCreateAction();
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (selectedActionId === actionId) {
      setSelectedActionId(null);
    }
    await deleteStepAction(actionId);
  };

  const handleSave = () => {
    // A ação já foi salva pelo StepActionForm
    // Aqui podemos adicionar lógica adicional se necessário
  };

  const handleDiscard = () => {
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    setSelectedActionId(null);
    setShowDiscardDialog(false);
  };

  const handleUnsavedDialogSave = async () => {
    if (stepActionFormSaveRef.current) {
      await stepActionFormSaveRef.current();
    }
    if (processNameDirty && flow && id) {
      await updateFlow({ id, name: processName.trim() });
    }
    setShowUnsavedDialog(false);
    if (pendingAction === "navigate" && pendingNavigateRef.current) {
      pendingNavigateRef.current();
      pendingNavigateRef.current = null;
    } else if (pendingAction === "create") {
      doCreateAction();
    } else if (pendingAction === "select" && pendingSelectActionId !== null) {
      setSelectedActionId(pendingSelectActionId);
      setPendingSelectActionId(null);
    } else if (pendingAction === "changeStep" && pendingStepId !== null) {
      setSelectedStepId(pendingStepId);
      setSelectedActionId(null);
      setPendingStepId(null);
    }
    setPendingAction(null);
    if (blocker.state === "blocked") blocker.reset?.();
  };

  const handleUnsavedDialogDontSave = () => {
    setShowUnsavedDialog(false);
    setFormHasUnsavedChanges(false);
    setProcessName(flow?.name ?? "");
    if (pendingAction === "navigate" && pendingNavigateRef.current) {
      pendingNavigateRef.current();
      pendingNavigateRef.current = null;
    } else if (pendingAction === "create") {
      doCreateAction();
    } else if (pendingAction === "select" && pendingSelectActionId !== null) {
      setSelectedActionId(pendingSelectActionId);
      setPendingSelectActionId(null);
    } else if (pendingAction === "changeStep" && pendingStepId !== null) {
      setSelectedStepId(pendingStepId);
      setSelectedActionId(null);
      setPendingStepId(null);
    }
    setPendingAction(null);
    blocker.reset?.();
  };

  const handleUnsavedDialogCancel = () => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
    setPendingSelectActionId(null);
    setPendingStepId(null);
    pendingNavigateRef.current = null;
    blocker.reset?.();
  };

  if (isLoadingFlow || isLoadingSteps) {
    return (
      <div className="min-h-screen bg-neutral-50  flex items-center justify-center">
        <div className="text-neutral-500">Carregando...</div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="min-h-screen bg-neutral-50  flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Flow não encontrado</p>
          <Button onClick={() => navigate("/crm/flows")}>Voltar</Button>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50  flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">
            Este flow não possui etapas. Crie etapas primeiro.
          </p>
          <Button onClick={() => navigate(`/crm/flows/${id}/builder`)}>
            Ir para Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50  text-neutral-800  font-sans h-screen flex overflow-hidden">
      <ProcessSidebar
        stepId={selectedStepId || steps[0].id}
        selectedActionId={selectedActionId}
        onSelectAction={handleSelectAction}
        onCreateAction={handleCreateAction}
        onDeleteAction={handleDeleteAction}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50  relative">
        <header className="bg-white  px-8 py-4 border-b border-neutral-200  flex items-center justify-between z-10">
          <div className="flex-1 max-w-2xl">
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
              Nome do Processo
            </label>
            <div className="flex items-center gap-2 group">
              <Input
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                className="text-xl font-bold text-neutral-900  bg-transparent border-0 border-b border-transparent group-hover:border-neutral-300 focus:border-primary focus:ring-0 px-0 py-1 w-full transition-colors placeholder-neutral-300 "
                placeholder="Digite o nome do processo..."
              />
              <span className="material-icons-outlined text-neutral-400 text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                edit
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleDiscard}
              className="px-4 py-2 text-sm font-medium text-neutral-600  hover:text-neutral-900 :text-white transition-colors"
            >
              Descartar
            </Button>
          </div>
        </header>

        {/* Step Selector */}
        {steps.length > 1 && (
          <div className="bg-white  border-b border-neutral-200  px-8 py-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-500">Etapa:</label>
              <select
                value={selectedStepId || ""}
                onChange={(e) => {
                  const newStepId = e.target.value;
                  if (hasUnsavedChanges && newStepId !== selectedStepId) {
                    setPendingAction("changeStep");
                    setPendingStepId(newStepId);
                    setShowUnsavedDialog(true);
                  } else {
                    setSelectedStepId(newStepId);
                    setSelectedActionId(null);
                  }
                }}
                className="text-sm bg-transparent border border-neutral-200  rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {steps.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <StepActionForm
          stepId={selectedStepId || steps[0].id}
          action={selectedAction}
          onSave={handleSave}
          onDirtyChange={setFormHasUnsavedChanges}
          saveRef={stepActionFormSaveRef}
        />

        {/* Custom Fields e Checklist - Serão integrados no StepActionForm futuramente */}
      </main>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja descartar todas as alterações não salvas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Deseja salvar antes de continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleUnsavedDialogCancel}>
              Cancelar
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleUnsavedDialogDontSave}>
              Não salvar
            </Button>
            <Button onClick={handleUnsavedDialogSave}>
              Salvar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

