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
import { useContactAutomations, type AutomationType } from "@/hooks/useContactAutomations";
import { useNexflowFlows } from "@/hooks/useNexflowFlows";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { toast } from "sonner";
import { SimpleAutomationForm } from "./automation-forms/SimpleAutomationForm";
import { FieldConditionalAutomationForm } from "./automation-forms/FieldConditionalAutomationForm";
import { ContactTypeAutomationForm } from "./automation-forms/ContactTypeAutomationForm";

// Componente para exibir nome da etapa
function StepNameCell({ stepId, flowId }: { stepId: string; flowId: string }) {
  const { steps } = useNexflowSteps(flowId);
  const step = steps.find((s) => s.id === stepId);
  return <span>{step?.title || stepId.slice(0, 8) + "..."}</span>;
}

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

  // Estados para tipo de automação
  const [automationType, setAutomationType] = useState<AutomationType>("simple");

  // Estados para automação simples
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [selectedStepId, setSelectedStepId] = useState<string>("");

  // Estados para automação condicional por campo
  const [fieldName, setFieldName] = useState<string>("");
  const [conditionValue, setConditionValue] = useState<string>("");
  const [trueFlowId, setTrueFlowId] = useState<string>("");
  const [trueStepId, setTrueStepId] = useState<string>("");
  const [falseFlowId, setFalseFlowId] = useState<string>("");
  const [falseStepId, setFalseStepId] = useState<string>("");

  // Estados para automação por tipo de contato
  const [contactType, setContactType] = useState<"parceiro" | "cliente" | "">("");
  const [contactTypeFlowId, setContactTypeFlowId] = useState<string>("");
  const [contactTypeStepId, setContactTypeStepId] = useState<string>("");

  const [isAdding, setIsAdding] = useState(false);

  const getAutomationTypeLabel = (type: AutomationType): string => {
    switch (type) {
      case "simple":
        return "Simples";
      case "field_conditional":
        return "Por Campo";
      case "contact_type":
        return "Por Tipo";
      default:
        return type;
    }
  };

  const resetForm = () => {
    setAutomationType("simple");
    setSelectedFlowId("");
    setSelectedStepId("");
    setFieldName("");
    setConditionValue("");
    setTrueFlowId("");
    setTrueStepId("");
    setFalseFlowId("");
    setFalseStepId("");
    setContactType("");
    setContactTypeFlowId("");
    setContactTypeStepId("");
  };

  const validateForm = (): boolean => {
    switch (automationType) {
      case "simple":
        if (!selectedFlowId || !selectedStepId) {
          toast.error("Selecione um Flow e uma Etapa");
          return false;
        }
        return true;

      case "field_conditional":
        if (!fieldName || !conditionValue || !trueFlowId || !trueStepId) {
          toast.error("Preencha todos os campos obrigatórios");
          return false;
        }
        return true;

      case "contact_type":
        if (!contactType || !contactTypeFlowId || !contactTypeStepId) {
          toast.error("Selecione o tipo de contato, Flow e Etapa");
          return false;
        }
        return true;

      default:
        return false;
    }
  };

  const handleAddAutomation = async () => {
    if (!validateForm()) {
      return;
    }

    setIsAdding(true);
    try {
      let triggerConditions = {};
      let targetFlowId = "";
      let targetStepId = "";

      switch (automationType) {
        case "simple":
          targetFlowId = selectedFlowId;
          targetStepId = selectedStepId;
          break;

        case "field_conditional":
          targetFlowId = trueFlowId;
          targetStepId = trueStepId;
          triggerConditions = {
            type: "field_conditional",
            fieldName,
            conditionValue,
            trueFlowId,
            trueStepId,
            ...(falseFlowId && falseStepId
              ? { falseFlowId, falseStepId }
              : {}),
          };
          break;

        case "contact_type":
          targetFlowId = contactTypeFlowId;
          targetStepId = contactTypeStepId;
          triggerConditions = {
            type: "contact_type",
            contactType,
          };
          break;
      }

      await createAutomation({
        automationType,
        targetFlowId,
        targetStepId,
        isActive: true,
        triggerConditions,
      });

      resetForm();
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

  const renderAutomationForm = () => {
    switch (automationType) {
      case "simple":
        return (
          <SimpleAutomationForm
            selectedFlowId={selectedFlowId}
            selectedStepId={selectedStepId}
            onFlowChange={setSelectedFlowId}
            onStepChange={setSelectedStepId}
            isLoadingFlows={isLoadingFlows}
          />
        );

      case "field_conditional":
        return (
          <FieldConditionalAutomationForm
            fieldName={fieldName}
            conditionValue={conditionValue}
            trueFlowId={trueFlowId}
            trueStepId={trueStepId}
            falseFlowId={falseFlowId}
            falseStepId={falseStepId}
            onFieldNameChange={setFieldName}
            onConditionValueChange={setConditionValue}
            onTrueFlowChange={setTrueFlowId}
            onTrueStepChange={setTrueStepId}
            onFalseFlowChange={setFalseFlowId}
            onFalseStepChange={setFalseStepId}
            isLoadingFlows={isLoadingFlows}
          />
        );

      case "contact_type":
        return (
          <ContactTypeAutomationForm
            contactType={contactType}
            selectedFlowId={contactTypeFlowId}
            selectedStepId={contactTypeStepId}
            onContactTypeChange={(type) => setContactType(type)}
            onFlowChange={setContactTypeFlowId}
            onStepChange={setContactTypeStepId}
            isLoadingFlows={isLoadingFlows}
          />
        );

      default:
        return null;
    }
  };

  const isFormValid = () => {
    switch (automationType) {
      case "simple":
        return selectedFlowId && selectedStepId;
      case "field_conditional":
        return fieldName && conditionValue && trueFlowId && trueStepId;
      case "contact_type":
        return contactType && contactTypeFlowId && contactTypeStepId;
      default:
        return false;
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
            
            <div className="space-y-2">
              <Label>Tipo de Automação</Label>
              <Select
                value={automationType}
                onValueChange={(value) => {
                  const newType = value as AutomationType;
                  resetForm();
                  setAutomationType(newType);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simples (sempre cria)</SelectItem>
                  <SelectItem value="field_conditional">
                    Por Campo (condicional)
                  </SelectItem>
                  <SelectItem value="contact_type">
                    Por Tipo (parceiro/cliente)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderAutomationForm()}

            <Button
              onClick={handleAddAutomation}
              disabled={!isFormValid() || isAdding}
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Flow</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Condição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automations.map((automation) => {
                      const flow = flows.find(
                        (f) => f.id === automation.targetFlowId
                      );

                      // Determinar descrição da condição
                      let conditionDescription = "-";
                      if (automation.automationType === "field_conditional") {
                        const conditions = automation.triggerConditions as any;
                        if (conditions?.fieldName && conditions?.conditionValue) {
                          conditionDescription = `${conditions.fieldName} = ${conditions.conditionValue}`;
                        }
                      } else if (automation.automationType === "contact_type") {
                        const conditions = automation.triggerConditions as any;
                        if (conditions?.contactType) {
                          conditionDescription = `Tipo: ${conditions.contactType}`;
                        }
                      }

                      return (
                        <TableRow key={automation.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {getAutomationTypeLabel(automation.automationType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {flow?.name || "Flow não encontrado"}
                          </TableCell>
                          <TableCell>
                            <StepNameCell stepId={automation.targetStepId} flowId={automation.targetFlowId} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {conditionDescription}
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
