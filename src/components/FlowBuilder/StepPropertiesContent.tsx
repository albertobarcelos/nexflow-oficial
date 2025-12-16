import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { VisibilitySelector } from "./VisibilitySelector";
import type { VisibilityConfig } from "./VisibilitySelector";
import type { NexflowStep } from "@/types/nexflow";
import type { StepDraft } from "@/hooks/useFlowBuilderState";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Palette } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [localColor, setLocalColor] = useState(currentColor);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Propriedades da etapa
        </p>
        <p className="text-xs text-slate-500">
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
                  className="flex items-center gap-2 h-10 px-3 rounded-lg border-2 border-slate-300 hover:border-slate-400 transition-colors"
                  aria-label="Selecionar cor"
                >
                  <div
                    className="h-6 w-6 rounded border border-slate-200"
                    style={{ backgroundColor: localColor }}
                  />
                  <Palette className="h-4 w-4 text-slate-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-slate-700">Selecionar cor</Label>
                  <div className="space-y-2">
                    <Input
                      type="color"
                      value={localColor}
                      onChange={handleColorInputChange}
                      className="h-10 w-full cursor-pointer border-2 border-slate-200 rounded"
                      aria-label="Selecionar cor"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-600 whitespace-nowrap">Código:</Label>
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
            <span className="text-sm text-slate-600">{localColor}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Visibility Selector */}
      <VisibilitySelector
        value={visibilityConfig}
        onChange={handleVisibilityChange}
      />
    </div>
  );
}

