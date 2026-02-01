import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useStepChildCardAutomations } from "@/hooks/useStepChildCardAutomations";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { toast } from "sonner";

interface ChildCardAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepId: string;
}

export function ChildCardAutomationDialog({
  open,
  onOpenChange,
  stepId,
}: ChildCardAutomationDialogProps) {
  const {
    automations,
    isLoading,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    isCreating,
    isDeleting,
  } = useStepChildCardAutomations(stepId);

  const { flows, isLoading: isLoadingFlows } = useNexflowFlows();

  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [selectedStepId, setSelectedStepId] = useState<string>("");
  const [copyFieldValues, setCopyFieldValues] = useState(false);
  const [copyAssignment, setCopyAssignment] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Buscar steps do flow selecionado
  const { steps: targetSteps, isLoading: isLoadingSteps } = useNexflowSteps(
    selectedFlowId || undefined
  );

  // Resetar formulário quando o dialog abrir
  useEffect(() => {
    if (open) {
      setSelectedFlowId("");
      setSelectedStepId("");
      setCopyFieldValues(false);
      setCopyAssignment(false);
    }
  }, [open]);

  const handleAddAutomation = async () => {
    if (!selectedFlowId || !selectedStepId) {
      toast.error("Selecione um Flow e uma Etapa de destino");
      return;
    }

    setIsAdding(true);
    try {
      await createAutomation({
        stepId,
        targetFlowId: selectedFlowId,
        targetStepId: selectedStepId,
        isActive: true,
        copyFieldValues,
        copyAssignment,
      });
      setSelectedFlowId("");
      setSelectedStepId("");
      setCopyFieldValues(false);
      setCopyAssignment(false);
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
        "Tem certeza que deseja remover esta automação de card filho?"
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
          <DialogTitle>Configuração de Automação de Card Filho</DialogTitle>
          <DialogDescription>
            Configure regras para criar cards filhos automaticamente quando um card entrar nesta etapa.
            O card filho será criado no flow e etapa de destino selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Formulário para adicionar nova regra */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm">Adicionar Nova Automação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flow de Destino</Label>
                <Select
                  value={selectedFlowId}
                  onValueChange={(value) => {
                    setSelectedFlowId(value);
                    setSelectedStepId(""); // Resetar etapa quando mudar flow
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
                <Label>Etapa de Destino</Label>
                <Select
                  value={selectedStepId}
                  onValueChange={setSelectedStepId}
                  disabled={!selectedFlowId || isLoadingSteps || targetSteps.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma Etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetSteps.map((step) => (
                      <SelectItem key={step.id} value={step.id}>
                        {step.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Opções de Cópia</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copy-field-values"
                  checked={copyFieldValues}
                  onCheckedChange={(checked) => setCopyFieldValues(checked === true)}
                />
                <Label
                  htmlFor="copy-field-values"
                  className="text-sm font-normal cursor-pointer"
                >
                  Copiar valores dos campos do card pai
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copy-assignment"
                  checked={copyAssignment}
                  onCheckedChange={(checked) => setCopyAssignment(checked === true)}
                />
                <Label
                  htmlFor="copy-assignment"
                  className="text-sm font-normal cursor-pointer"
                >
                  Copiar atribuições (responsável, time, agentes)
                </Label>
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
                  Adicionar Automação
                </>
              )}
            </Button>
          </div>

          {/* Lista de automações existentes */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Automações Configuradas</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : automations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhuma automação configurada. Adicione uma automação acima.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flow de Destino</TableHead>
                      <TableHead>Etapa de Destino</TableHead>
                      <TableHead>Opções</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automations.map((automation) => {
                      const flow = flows.find(
                        (f) => f.id === automation.targetFlowId
                      );

                      return (
                        <AutomationRow
                          key={automation.id}
                          automation={automation}
                          flow={flow}
                          onToggleActive={handleToggleActive}
                          onDelete={handleDelete}
                          isDeleting={isDeleting}
                        />
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

interface AutomationRowProps {
  automation: {
    id: string;
    targetFlowId: string;
    targetStepId: string;
    isActive: boolean;
    copyFieldValues: boolean;
    copyAssignment: boolean;
  };
  flow: { id: string; name: string } | undefined;
  onToggleActive: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function AutomationRow({
  automation,
  flow,
  onToggleActive,
  onDelete,
  isDeleting,
}: AutomationRowProps) {
  const { steps } = useNexflowSteps(automation.targetFlowId);
  const step = steps.find((s) => s.id === automation.targetStepId);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {flow?.name || "Flow não encontrado"}
      </TableCell>
      <TableCell>
        {step?.title || `Etapa ${automation.targetStepId.slice(0, 8)}...`}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1 text-xs">
          {automation.copyFieldValues && (
            <Badge variant="outline" className="w-fit">
              Copiar Campos
            </Badge>
          )}
          {automation.copyAssignment && (
            <Badge variant="outline" className="w-fit">
              Copiar Atribuições
            </Badge>
          )}
          {!automation.copyFieldValues && !automation.copyAssignment && (
            <span className="text-muted-foreground">Nenhuma opção</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={automation.isActive}
            onCheckedChange={() =>
              onToggleActive(automation.id, automation.isActive)
            }
          />
          <Badge
            variant={automation.isActive ? "default" : "secondary"}
          >
            {automation.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(automation.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

