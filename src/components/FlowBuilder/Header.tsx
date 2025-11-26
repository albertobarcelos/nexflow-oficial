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
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Save,
  ArrowLeft,
  Loader2,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import type { NexflowStep } from "@/types/nexflow";

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
  onSelectStep: (stepId: string) => void;
  onCreateStep: (payload: { title: string; color: string }) => Promise<void>;
  onRenameStep: (stepId: string, title: string) => void;
  onDeleteStep: (stepId: string) => void;
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
  onSelectStep,
  onCreateStep,
  onRenameStep,
  onDeleteStep,
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

  return (
    <header className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Flow Builder
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{flowName}</h1>
          </div>
        </div>
        {flowDescription && (
          <p className="text-sm text-slate-500">{flowDescription}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {steps.length} etapas
          </span>
          {pendingMutations > 0 && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600">
              {pendingMutations} alterações pendentes
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:w-1/2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Etapas do fluxo
          </p>
          <Button
            size="sm"
            className="bg-blue-900 text-white hover:bg-blue-800"
            onClick={() => {
              setNewStepName("");
              setNewStepColor(nextColor);
              setIsCreateStepOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova etapa
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "group relative min-w-[170px] rounded-xl border px-4 py-3",
                step.id === activeStepId
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
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
                  className="h-8 bg-white text-sm"
                />
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-sm font-semibold gap-3"
                  onClick={() => onSelectStep(step.id)}
                  onDoubleClick={() => startEditing(step)}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="truncate">{step.title}</span>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="ml-2 hidden rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-600 group-hover:flex"
                      >
                        <MoreVertical className="h-4 w-4" />
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          className="h-11 rounded-xl bg-orange-500 px-6 text-base font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          onClick={onSave}
          disabled={isSaving || !canSave}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>

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
                        ? "border-slate-900"
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
    </header>
  );
}

