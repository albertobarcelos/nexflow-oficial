import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";

interface FieldConditionalAutomationFormProps {
  fieldName: string;
  conditionValue: string;
  trueFlowId: string;
  trueStepId: string;
  falseFlowId: string;
  falseStepId: string;
  onFieldNameChange: (fieldName: string) => void;
  onConditionValueChange: (value: string) => void;
  onTrueFlowChange: (flowId: string) => void;
  onTrueStepChange: (stepId: string) => void;
  onFalseFlowChange: (flowId: string) => void;
  onFalseStepChange: (stepId: string) => void;
  isLoadingFlows?: boolean;
}

const AVAILABLE_FIELDS = [
  { value: "client_name", label: "Nome do Cliente" },
  { value: "main_contact", label: "Contato Principal" },
  { value: "assigned_team_id", label: "Time Atribuído" },
] as const;

export function FieldConditionalAutomationForm({
  fieldName,
  conditionValue,
  trueFlowId,
  trueStepId,
  falseFlowId,
  falseStepId,
  onFieldNameChange,
  onConditionValueChange,
  onTrueFlowChange,
  onTrueStepChange,
  onFalseFlowChange,
  onFalseStepChange,
  isLoadingFlows = false,
}: FieldConditionalAutomationFormProps) {
  const { flows, isLoading: isLoadingFlowsData } = useNexflowFlows();
  const { steps: trueSteps, isLoading: isLoadingTrueSteps } = useNexflowSteps(
    trueFlowId || undefined
  );
  const { steps: falseSteps, isLoading: isLoadingFalseSteps } = useNexflowSteps(
    falseFlowId || undefined
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Campo</Label>
          <Select value={fieldName} onValueChange={onFieldNameChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um campo" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_FIELDS.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Valor da Condição</Label>
          <Input
            value={conditionValue}
            onChange={(e) => onConditionValueChange(e.target.value)}
            placeholder="Ex: Y"
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div>
          <Label className="text-sm font-semibold">
            Se o campo tiver o valor acima:
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Flow</Label>
            <Select
              value={trueFlowId}
              onValueChange={onTrueFlowChange}
              disabled={isLoadingFlows || isLoadingFlowsData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um Flow" />
              </SelectTrigger>
              <SelectContent>
                {flows.map((flow) => (
                  <SelectItem key={flow.id} value={flow.id}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Etapa</Label>
            <Select
              value={trueStepId}
              onValueChange={onTrueStepChange}
              disabled={!trueFlowId || isLoadingTrueSteps || trueSteps.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma Etapa" />
              </SelectTrigger>
              <SelectContent>
                {trueSteps.map((step) => (
                  <SelectItem key={step.id} value={step.id}>
                    {step.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div>
          <Label className="text-sm font-semibold">
            Caso contrário (opcional):
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Flow</Label>
              {falseFlowId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    onFalseFlowChange("");
                    onFalseStepChange("");
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
            <Select
              value={falseFlowId || undefined}
              onValueChange={(value) => onFalseFlowChange(value)}
              disabled={isLoadingFlows || isLoadingFlowsData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um Flow (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {flows.map((flow) => (
                  <SelectItem key={flow.id} value={flow.id}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Etapa</Label>
            <Select
              value={falseStepId}
              onValueChange={onFalseStepChange}
              disabled={!falseFlowId || isLoadingFalseSteps || falseSteps.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma Etapa" />
              </SelectTrigger>
              <SelectContent>
                {falseSteps.map((step) => (
                  <SelectItem key={step.id} value={step.id}>
                    {step.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
