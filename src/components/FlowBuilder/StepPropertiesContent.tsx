import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { VisibilitySelector } from "./VisibilitySelector";
import type { VisibilityConfig } from "./VisibilitySelector";
import type { NexflowStep, StepType } from "@/types/nexflow";
import type { StepDraft } from "@/hooks/useFlowBuilderState";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Palette, GitBranch, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChildCardAutomationDialog } from "@/components/crm/flows/ChildCardAutomationDialog";
import { cn } from "@/lib/utils";

interface StepPropertiesContentProps {
  step: NexflowStep;
  stepDraft: StepDraft | null;
  onStepUpdate?: (stepId: string, updates: { title?: string; color?: string }) => void | Promise<void>;
  onStepDraftChange: (updates: Partial<StepDraft>) => void;
}

export function StepPropertiesContent({
  step,
  stepDraft,
  onStepUpdate,
  onStepDraftChange,
}: StepPropertiesContentProps) {
  // Usar cor do draft se disponível, senão usar cor do step
  const currentColor = stepDraft?.color ?? step.color;
  const currentStepType = stepDraft?.stepType ?? step.stepType ?? "standard";
  const [localColor, setLocalColor] = useState(currentColor);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);

  // Valores padrão para visibilidade (usa draft se disponível, senão usa valores padrão)
  const visibilityConfig: VisibilityConfig = stepDraft ? {
    visibilityType: stepDraft.visibilityType,
    visibleTeamIds: stepDraft.visibleTeamIds,
    excludedUserIds: stepDraft.excludedUserIds,
  } : {
    visibilityType: "company",
    visibleTeamIds: [],
    excludedUserIds: [],
  };

  // Sincronizar cor local com a cor do draft quando mudar
  useEffect(() => {
    setLocalColor(currentColor);
  }, [currentColor]);

  const handleVisibilityChange = (config: VisibilityConfig) => {
    onStepDraftChange({
      visibilityType: config.visibilityType,
      visibleTeamIds: config.visibleTeamIds,
      excludedUserIds: config.excludedUserIds,
    });
  };

  const handleTitleChange = async (newTitle: string) => {
    // Atualizar título no draft
    onStepDraftChange({ title: newTitle.trim() });
    // Manter compatibilidade: também atualizar imediatamente se onStepUpdate existir
    if (onStepUpdate && newTitle.trim() !== step.title) {
      await onStepUpdate(step.id, { title: newTitle.trim() });
    }
  };

  const handleColorChange = (newColor: string) => {
    setLocalColor(newColor);
    // Apenas atualizar o draft, não salvar imediatamente
    onStepDraftChange({ color: newColor });
  };

  const handleColorInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    handleColorChange(newColor);
  };

  const handleStepTypeChange = (newStepType: StepType) => {
    onStepDraftChange({ stepType: newStepType });
  };

  const getStepTypeLabel = (type: StepType): string => {
    const labels: Record<StepType, string> = {
      standard: "Normal",
      finisher: "Concluídos",
      fail: "Cancelados",
      freezing: "Congelado",
    };
    return labels[type];
  };

  const getStepTypeDescription = (type: StepType): string => {
    const descriptions: Record<StepType, string> = {
      standard: "Etapa normal que pode utilizar campos e processos",
      finisher: "Card ao cair nesta etapa terá status como concluído. Não pode ter processos ou campos",
      fail: "Card ao cair nesta etapa terá status como cancelado. Não pode ter processos ou campos",
      freezing: "Card será congelado (apenas visualização) e o original seguirá para próxima etapa. Não pode ter processos ou campos",
    };
    return descriptions[type];
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-neutral-900">
          Propriedades da etapa
        </p>
        <p className="text-xs text-neutral-500">
          Configure as propriedades e visibilidade desta etapa.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nome da etapa</Label>
          <Input
            defaultValue={step.title}
            onBlur={(event) => handleTitleChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            placeholder="Ex: Aprovação Financeira"
          />
        </div>

        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex items-center gap-3">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 h-10 px-3 rounded-lg border-2 border-neutral-300 hover:border-neutral-400 transition-colors"
                  aria-label="Selecionar cor"
                >
                  <div
                    className="h-6 w-6 rounded border border-neutral-200"
                    style={{ backgroundColor: localColor }}
                  />
                  <Palette className="h-4 w-4 text-neutral-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-neutral-700">Selecionar cor</Label>
                  <div className="space-y-2">
                    <Input
                      type="color"
                      value={localColor}
                      onChange={handleColorInputChange}
                      className="h-10 w-full cursor-pointer border-2 border-neutral-200 rounded"
                      aria-label="Selecionar cor"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-neutral-600 whitespace-nowrap">Código:</Label>
                      <Input
                        type="text"
                        value={localColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            setLocalColor(value);
                            if (value.length === 7) {
                              handleColorChange(value);
                            }
                          } else if (value === "") {
                            // Permitir campo vazio temporariamente
                            setLocalColor(value);
                          }
                        }}
                        className="h-8 text-xs font-mono px-2 py-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-sm text-neutral-600">{localColor}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Tipo de etapa</Label>
          <Select value={currentStepType} onValueChange={handleStepTypeChange}>
            <SelectTrigger className={cn(
              "h-auto min-h-[80px] py-3 items-start justify-between",
              "[&>span]:line-clamp-none [&>span]:flex [&>span]:flex-col [&>span]:items-start [&>span]:gap-1 [&>span]:w-full [&>span]:text-left [&>span]:flex-1"
            )}>
              <SelectValue placeholder="Selecione o tipo de etapa" />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
              <SelectItem value="standard" className="py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">Normal</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Pode utilizar campos e processos
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="finisher" className="py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">Concluídos</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Card terá status concluído. Sem campos ou processos
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="fail" className="py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">Cancelados</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Card terá status cancelado. Sem campos ou processos
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="freezing" className="py-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">Congelado</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Card será congelado e original seguirá para próxima etapa
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Visibility Selector */}
      <VisibilitySelector
        value={visibilityConfig}
        onChange={handleVisibilityChange}
      />

      <Separator />

      {/* Automação de Card Filho */}
      <div className="space-y-2">
        <Label>Automação de Card Filho</Label>
        <p className="text-xs text-neutral-500">
          Configure para criar cards filhos automaticamente quando um card entrar nesta etapa.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsAutomationDialogOpen(true)}
        >
          <GitBranch className="mr-2 h-4 w-4" />
          Configurar Automação
        </Button>
      </div>

      <ChildCardAutomationDialog
        open={isAutomationDialogOpen}
        onOpenChange={setIsAutomationDialogOpen}
        stepId={step.id}
      />
    </div>
  );
}

