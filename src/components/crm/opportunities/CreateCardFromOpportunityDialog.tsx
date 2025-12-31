import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useCreateCardFromOpportunity } from "@/hooks/useCreateCardFromOpportunity";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { Opportunity } from "@/hooks/useOpportunities";

interface CreateCardFromOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
}

export function CreateCardFromOpportunityDialog({
  open,
  onOpenChange,
  opportunity,
}: CreateCardFromOpportunityDialogProps) {
  const { flows, isLoading: isLoadingFlows } = useNexflowFlows();
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [selectedStepId, setSelectedStepId] = useState<string>("");
  const [cardTitle, setCardTitle] = useState<string>("");

  const { steps, isLoading: isLoadingSteps } = useNexflowSteps(
    selectedFlowId || undefined
  );

  const { mutateAsync: createCard, isPending: isCreating } =
    useCreateCardFromOpportunity();

  const handleCreate = async () => {
    if (!opportunity || !selectedFlowId || !selectedStepId) {
      return;
    }

    try {
      await createCard({
        opportunityId: opportunity.id,
        flowId: selectedFlowId,
        stepId: selectedStepId,
        title: cardTitle || undefined,
      });
      onOpenChange(false);
      // Reset form
      setSelectedFlowId("");
      setSelectedStepId("");
      setCardTitle("");
    } catch (error) {
      // Error já é tratado no hook
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form ao fechar
      setSelectedFlowId("");
      setSelectedStepId("");
      setCardTitle("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Card a partir de Oportunidade</DialogTitle>
          <DialogDescription>
            Selecione o Flow e a Etapa onde o card será criado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {opportunity && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Oportunidade:</p>
              <p className="text-sm text-muted-foreground">
                {opportunity.client_name}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Título do Card (opcional)</Label>
            <Input
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder={
                opportunity?.client_name || "Título do card"
              }
            />
            <p className="text-xs text-muted-foreground">
              Se deixado em branco, usará o nome da oportunidade
            </p>
          </div>

          <div className="space-y-2">
            <Label>Flow</Label>
            <Select
              value={selectedFlowId}
              onValueChange={(value) => {
                setSelectedFlowId(value);
                setSelectedStepId(""); // Reset step quando flow muda
              }}
              disabled={isLoadingFlows}
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
              onValueChange={setSelectedStepId}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedFlowId || !selectedStepId || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Card"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




