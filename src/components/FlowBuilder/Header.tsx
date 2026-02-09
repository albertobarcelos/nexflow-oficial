import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Save,
  ArrowLeft,
  ArrowRight,
  Loader2,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import type { NexflowStep } from "@/types/nexflow";
import type { StepDraft } from "@/hooks/useFlowBuilderState";

const STEP_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#14b8a6",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#22c55e",
  "#f59e0b",
];

interface FlowBuilderHeaderProps {
  flowName: string;
  flowDescription?: string | null;
  steps: NexflowStep[];
  activeStepId: string | null;
  /** Draft da etapa ativa (painel de propriedades); usado para mostrar cor/título antes de salvar */
  activeStepDraft?: StepDraft | null;
  onSelectStep: (stepId: string) => void;
  onCreateStep: (payload: { title: string; color: string }) => Promise<void>;
  onRenameStep: (stepId: string, title: string) => void;
  onDeleteStep: (stepId: string) => void;
  onReorderSteps: (orderedIds: string[]) => Promise<void>;
  onSave: () => void;
  isSaving: boolean;
  pendingMutations: number;
  onBack?: () => void;
  canSave: boolean;
}

export function FlowBuilderHeader({
  flowName,
  flowDescription,
  steps,
  activeStepId,
  activeStepDraft,
  onSelectStep,
  onCreateStep,
  onRenameStep,
  onDeleteStep,
  onReorderSteps,
  onSave,
  isSaving,
  pendingMutations,
  onBack,
  canSave,
}: FlowBuilderHeaderProps) {
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepDraft, setStepDraft] = useState("");
  const [isCreateStepOpen, setIsCreateStepOpen] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [newStepColor, setNewStepColor] = useState(STEP_COLORS[0]);
  const canDeleteSteps = steps.length > 1;

  const nextColor = useMemo(
    () => STEP_COLORS[steps.length % STEP_COLORS.length],
    [steps.length]
  );

  // Ordenar etapas por position antes de renderizar
  const sortedSteps = useMemo(
    () => [...steps].sort((a, b) => a.position - b.position),
    [steps]
  );

  const startEditing = (step: NexflowStep) => {
    setEditingStepId(step.id);
    setStepDraft(step.title);
  };

  const commitEditing = (stepId: string) => {
    if (!stepDraft.trim()) {
      return;
    }
    onRenameStep(stepId, stepDraft.trim());
    setEditingStepId(null);
  };

  const handleMoveStepForward = async (stepId: string) => {
    const currentIndex = sortedSteps.findIndex((s) => s.id === stepId);
    if (currentIndex === -1 || currentIndex === sortedSteps.length - 1) {
      return;
    }

    const newOrder = [...sortedSteps];
    const [movedStep] = newOrder.splice(currentIndex, 1);
    newOrder.splice(currentIndex + 1, 0, movedStep);

    const orderedIds = newOrder.map((step) => step.id);
    await onReorderSteps(orderedIds);
  };

  const handleMoveStepBackward = async (stepId: string) => {
    const currentIndex = sortedSteps.findIndex((s) => s.id === stepId);
    if (currentIndex === -1 || currentIndex === 0) {
      return;
    }

    const newOrder = [...sortedSteps];
    const [movedStep] = newOrder.splice(currentIndex, 1);
    newOrder.splice(currentIndex - 1, 0, movedStep);

    const orderedIds = newOrder.map((step) => step.id);
    await onReorderSteps(orderedIds);
  };

  return (
    <>
      <header className="w-full px-8 py-6 flex items-start justify-between border-b border-neutral-200  bg-white  shadow-sm">
        <div className="flex items-start gap-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="group flex items-center text-neutral-500 hover:text-primary  :text-white transition-colors mt-1"
            >
              <ArrowLeft className="text-xl mr-1 h-5 w-5" />
              <span className="font-medium text-sm">Voltar</span>
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-1">
              Flow Builder
            </span>
            <h1 className="text-3xl font-bold text-neutral-900  leading-none mb-3">
              {flowName}
            </h1>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-100  text-neutral-600  text-xs font-semibold w-fit">
              {steps.length} etapas
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Espaço reservado para futuras ações do header */}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-bold text-neutral-400  tracking-widest uppercase text-left">
              Etapas do Fluxo
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => {
                setNewStepName("");
                setNewStepColor(nextColor);
                setIsCreateStepOpen(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <Plus className="text-sm h-4 w-4" />
              Nova etapa
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving || !canSave}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-xl shadow-sm transition-colors text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50",
                // Com alterações não salvas: laranja mais escuro e visível
                canSave && !isSaving
                  ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="text-lg h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="text-lg h-5 w-5" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="flex flex-nowrap items-center gap-4 overflow-x-auto overflow-y-hidden pb-4 -mx-2 px-2" style={{ scrollbarWidth: 'thin' }}>
            {sortedSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 flex-shrink-0">
                <div
                  className={cn(
                    "group relative flex items-center justify-between w-64 p-4 rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition-all",
                    step.id === activeStepId
                      ? "border-orange-500 bg-orange-50  "
                      : "border-neutral-200  bg-neutral-50  hover:border-neutral-300 :border-neutral-600"
                  )}
                >
                  {editingStepId === step.id ? (
                    <Input
                      value={stepDraft}
                      autoFocus
                      onChange={(event) => setStepDraft(event.target.value)}
                      onBlur={() => commitEditing(step.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitEditing(step.id);
                        }
                        if (event.key === "Escape") {
                          setEditingStepId(null);
                        }
                      }}
                      className="h-8 bg-white text-sm flex-1"
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-3"
                        onClick={() => onSelectStep(step.id)}
                        onDoubleClick={() => startEditing(step)}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              step.id === activeStepId && activeStepDraft?.color
                                ? activeStepDraft.color
                                : step.color,
                          }}
                        />
                        <span
                          className={cn(
                            "font-semibold text-sm",
                            step.id === activeStepId
                              ? "text-orange-700 "
                              : "text-neutral-600 "
                          )}
                        >
                          {step.title}
                        </span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="text-neutral-400 hover:text-neutral-600 :text-neutral-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="text-lg h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="bottom"
                          align="center"
                          sideOffset={6}
                          className="min-w-[160px]"
                        >
                          <DropdownMenuItem
                            onClick={() => startEditing(step)}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteStep(step.id)}
                            disabled={!canDeleteSteps}
                            className={cn(
                              "flex items-center gap-2 text-destructive focus:text-destructive",
                              !canDeleteSteps && "opacity-60"
                            )}
                          >
                            <Trash className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleMoveStepForward(step.id)}
                            disabled={index === sortedSteps.length - 1}
                            className={cn(
                              "flex items-center gap-2",
                              index === sortedSteps.length - 1 && "opacity-60"
                            )}
                          >
                            <ArrowRight className="h-4 w-4" />
                            Avançar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMoveStepBackward(step.id)}
                            disabled={index === 0}
                            className={cn(
                              "flex items-center gap-2",
                              index === 0 && "opacity-60"
                            )}
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Retroceder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
                {index < sortedSteps.length - 1 && (
                  <div className="w-8 h-[2px] bg-neutral-300  rounded-full flex-shrink-0" />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setNewStepName("");
                setNewStepColor(nextColor);
                setIsCreateStepOpen(true);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-dashed border-neutral-300  text-neutral-400 hover:text-primary hover:border-primary cursor-pointer transition-colors flex-shrink-0"
            >
              <Plus className="text-lg h-5 w-5" />
            </button>
          </div>
        </div>
      </main>

      <Dialog open={isCreateStepOpen} onOpenChange={setIsCreateStepOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da etapa</Label>
              <Input
                placeholder="Ex: Aprovação Financeira"
                value={newStepName}
                onChange={(event) => setNewStepName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {STEP_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition",
                      newStepColor === color
                        ? "border-neutral-900"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewStepColor(color)}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
                <Input
                  type="color"
                  value={newStepColor}
                  onChange={(event) => setNewStepColor(event.target.value)}
                  className="h-8 w-16 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsCreateStepOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                await onCreateStep({
                  title: newStepName,
                  color: newStepColor,
                });
                setNewStepName("");
                setNewStepColor(nextColor);
                setIsCreateStepOpen(false);
              }}
            >
              Criar etapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

