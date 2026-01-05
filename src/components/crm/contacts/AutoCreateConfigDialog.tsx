import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useContactAutomations } from "@/hooks/useContactAutomations";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { toast } from "sonner";

interface AutoCreateConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutoCreateConfigDialog({
  open,
  onOpenChange,
}: AutoCreateConfigDialogProps) {
  const {
    automations,
    isLoading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    isCreating,
    isDeleting,
  } = useContactAutomations();

  const { flows, isLoading: isLoadingFlows } = useNexflowFlows();

  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [selectedStepId, setSelectedStepId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  // Buscar steps do flow selecionado
  const { steps, isLoading: isLoadingSteps } = useNexflowSteps(selectedFlowId || undefined);

  const handleAddAutomation = async () => {
    if (!selectedFlowId || !selectedStepId) {
      toast.error("Selecione um Flow e uma Etapa");
      return;
    }

    setIsAdding(true);
    try {
      await createAutomation({
        targetFlowId: selectedFlowId,
        targetStepId: selectedStepId,
        isActive: true,
      });
      setSelectedFlowId("");
      setSelectedStepId("");
    } catch (error) {
      // Error já é tratado no hook
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleActive = async (
    id: string,
    currentActive: boolean
  ) => {
    try {
      await updateAutomation({
        id,
        isActive: !currentActive,
      });
    } catch (error) {
      // Error já é tratado no hook
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja remover esta regra de automação?"
      )
    ) {
      return;
    }

    try {
      await deleteAutomation(id);
    } catch (error) {
      // Error já é tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Configuração de AutoCreate</DialogTitle>
          <DialogDescription>
            Configure regras para criar cards automaticamente quando uma
            oportunidade for criada
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Formulário para adicionar nova regra */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm">Adicionar Nova Regra</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flow</Label>
                <Select
                  value={selectedFlowId}
                  onValueChange={setSelectedFlowId}
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
            </div>

            <Button
              onClick={handleAddAutomation}
              disabled={!selectedFlowId || !selectedStepId || isAdding}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Regra
                </>
              )}
            </Button>
          </div>

          {/* Lista de regras existentes */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Regras Configuradas</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : automations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhuma regra configurada. Adicione uma regra acima.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flow</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automations.map((automation) => {
                      const flow = flows.find(
                        (f) => f.id === automation.targetFlowId
                      );
                      // Para exibir o nome da etapa, precisaríamos buscar os steps
                      // Por enquanto, vamos apenas mostrar o ID
                      const stepName = `Etapa ${automation.targetStepId.slice(0, 8)}...`;

                      return (
                        <TableRow key={automation.id}>
                          <TableCell className="font-medium">
                            {flow?.name || "Flow não encontrado"}
                          </TableCell>
                          <TableCell>
                            {stepName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={automation.isActive}
                                onCheckedChange={() =>
                                  handleToggleActive(
                                    automation.id,
                                    automation.isActive
                                  )
                                }
                              />
                              <Badge
                                variant={
                                  automation.isActive
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {automation.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(automation.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

