import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";

interface ContactTypeAutomationFormProps {
  contactType: "parceiro" | "cliente" | "";
  selectedFlowId: string;
  selectedStepId: string;
  onContactTypeChange: (type: "parceiro" | "cliente") => void;
  onFlowChange: (flowId: string) => void;
  onStepChange: (stepId: string) => void;
  isLoadingFlows?: boolean;
}

export function ContactTypeAutomationForm({
  contactType,
  selectedFlowId,
  selectedStepId,
  onContactTypeChange,
  onFlowChange,
  onStepChange,
  isLoadingFlows = false,
}: ContactTypeAutomationFormProps) {
  const { flows, isLoading: isLoadingFlowsData } = useNexflowFlows();
  const { steps, isLoading: isLoadingSteps } = useNexflowSteps(
    selectedFlowId || undefined
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de Contato</Label>
        <Select
          value={contactType}
          onValueChange={(value) =>
            onContactTypeChange(value as "parceiro" | "cliente")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parceiro">Parceiro</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Flow</Label>
          <Select
            value={selectedFlowId}
            onValueChange={onFlowChange}
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
            value={selectedStepId}
            onValueChange={onStepChange}
            disabled={!selectedFlowId || isLoadingSteps || steps.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma Etapa" />
            </SelectTrigger>
            <SelectContent>
              {steps.map((step) => (
                <SelectItem key={step.id} value={step.id}>
                  {step.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
