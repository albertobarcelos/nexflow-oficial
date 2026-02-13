import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  X,
  History,
  FileEdit,
  MessageSquare,
  Lock,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { NexflowCard, NexflowStepField } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";
import { useNexflowFlow } from "@/hooks/useNexflowFlows";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { isSystemField, SYSTEM_FIELDS } from "@/lib/flowBuilder/systemFields";
import { formatCnpjCpf } from "@/lib/utils/cnpjCpf";
import { CardComments } from "./CardComments";
import { CardHistoryTab } from "@/features/nexflow/card-details/components/CardHistoryTab";

interface ParentCardViewModalProps {
  card: NexflowCard | null;
  open: boolean;
  onClose: () => void;
}

type ActiveSection = "fields" | "history" | "comments";

export function ParentCardViewModal({
  card,
  open,
  onClose,
}: ParentCardViewModalProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("fields");

  // Buscar steps do flow do card pai
  const { steps, isLoading: isLoadingSteps } = useNexflowFlow(card?.flowId);

  // Buscar usuários e times para exibir informações de atribuição
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();

  // Encontrar a etapa atual do card
  const currentStep = steps.find((step) => step.id === card?.stepId) ?? null;

  // Renderizar valor de campo em modo somente leitura
  const renderReadOnlyFieldValue = (field: NexflowStepField) => {
    if (!card) return null;
    const rawValue = card.fieldValues[field.id];

    // Campo de checklist
    if (field.fieldType === "checklist") {
      const progress = (card.checklistProgress?.[field.id] as Record<string, boolean>) ?? {};
      const items = field.configuration.items ?? [];
      if (!items.length) {
        return <span className="text-sm text-gray-400 italic">Checklist vazio</span>;
      }

      return (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle2
                className={cn(
                  "h-4 w-4 shrink-0",
                  progress?.[item] ? "text-green-500" : "text-gray-300"
                )}
              />
              <span className={progress?.[item] ? "text-gray-900 " : "text-gray-400"}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    // Campo de data
    if (field.fieldType === "date" && typeof rawValue === "string") {
      const parsed = new Date(rawValue);
      if (!Number.isNaN(parsed.getTime())) {
        return (
          <span className="text-sm text-gray-900 ">
            {format(parsed, "dd MMM yyyy", { locale: ptBR })}
          </span>
        );
      }
    }

    // Campo CPF/CNPJ
    if (field.configuration.validation === "cnpj_cpf" && typeof rawValue === "string") {
      const cnpjCpfType = (field.configuration.cnpjCpfType as "auto" | "cpf" | "cnpj") ?? "auto";
      return (
        <span className="text-sm text-gray-900 ">
          {formatCnpjCpf(rawValue, cnpjCpfType)}
        </span>
      );
    }

    // Campo de usuário (assigned_to)
    if (field.slug === SYSTEM_FIELDS.ASSIGNED_TO && typeof rawValue === "string") {
      const user = users.find((u) => u.id === rawValue);
      if (user) {
        return (
          <span className="text-sm text-gray-900 ">
            {user.name} {user.surname}
          </span>
        );
      }
    }

    // Campo de time (assigned_team_id)
    if (field.slug === SYSTEM_FIELDS.ASSIGNED_TEAM_ID && typeof rawValue === "string") {
      const team = teams.find((t) => t.id === rawValue);
      if (team) {
        return (
          <span className="text-sm text-gray-900 ">
            {team.name}
          </span>
        );
      }
    }

    // Campo agents
    if (field.slug === SYSTEM_FIELDS.AGENTS && Array.isArray(card.agents)) {
      if (card.agents.length === 0) {
        return <span className="text-sm text-gray-400 italic">Nenhum agente atribuído</span>;
      }
      const agentNames = card.agents
        .map((agentId) => {
          const user = users.find((u) => u.id === agentId);
          return user ? `${user.name} ${user.surname}` : null;
        })
        .filter(Boolean);
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {agentNames.map((name, idx) => (
            <span
              key={idx}
              className="text-sm px-2 py-1 bg-gray-100  rounded text-gray-900 "
            >
              {name}
            </span>
          ))}
        </div>
      );
    }

    // Valor padrão (texto)
    if (!rawValue) {
      return <span className="text-sm text-gray-400 italic">Não preenchido</span>;
    }

    return (
      <span className="text-sm text-gray-900 ">
        {typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue)}
      </span>
    );
  };

  // Renderizar campo em modo somente leitura
  const renderReadOnlyField = (field: NexflowStepField) => {
    // Ignorar campos de sistema que não devem ser exibidos diretamente
    if (isSystemField(field.slug || "")) {
      // Campos de sistema são tratados separadamente
      return null;
    }

    return (
      <div key={field.id} className="space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500  mb-1">
            {field.label}
            {field.isRequired && (
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                Obrigatório
              </span>
            )}
          </p>
          <div className="mt-1">
            {renderReadOnlyFieldValue(field)}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar campos de sistema (assigned_to, assigned_team_id, agents)
  const renderSystemFields = () => {
    if (!card || !currentStep) return null;

    const systemFields: JSX.Element[] = [];

    // Campo de responsável (usuário)
    if (card.assignedTo) {
      const user = users.find((u) => u.id === card.assignedTo);
      if (user) {
        systemFields.push(
          <div key="assigned_to" className="space-y-2">
            <p className="text-xs font-medium text-gray-500  mb-1">
              Responsável
            </p>
            <p className="text-sm text-gray-900 ">
              {user.name} {user.surname}
            </p>
          </div>
        );
      }
    }

    // Campo de time
    if (card.assignedTeamId) {
      const team = teams.find((t) => t.id === card.assignedTeamId);
      if (team) {
        systemFields.push(
          <div key="assigned_team" className="space-y-2">
            <p className="text-xs font-medium text-gray-500  mb-1">
              Time
            </p>
            <p className="text-sm text-gray-900 ">
              {team.name}
            </p>
          </div>
        );
      }
    }

    // Campo de agents
    if (card.agents && card.agents.length > 0) {
      const agentNames = card.agents
        .map((agentId) => {
          const user = users.find((u) => u.id === agentId);
          return user ? `${user.name} ${user.surname}` : null;
        })
        .filter(Boolean);
      
      if (agentNames.length > 0) {
        systemFields.push(
          <div key="agents" className="space-y-2">
            <p className="text-xs font-medium text-gray-500  mb-1">
              Agentes
            </p>
            <div className="flex flex-wrap gap-2">
              {agentNames.map((name, idx) => (
                <span
                  key={idx}
                  className="text-sm px-2 py-1 bg-gray-100  rounded text-gray-900 "
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        );
      }
    }

    return systemFields.length > 0 ? (
      <div className="space-y-4 mb-6 p-5 bg-gray-50  rounded-xl border border-gray-200 ">
        <h3 className="text-sm font-semibold text-gray-900  mb-4">
          Atribuições
        </h3>
        <div className="space-y-4">{systemFields}</div>
      </div>
    ) : null;
  };

  // Renderizar conteúdo por seção
  const renderSectionContent = () => {
    switch (activeSection) {
      case "fields":
        if (isLoadingSteps) {
          return (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-sm text-gray-500 ">
                  Carregando campos...
                </p>
              </div>
            </div>
          );
        }

        if (!card || !currentStep) {
          return (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500 ">
                Card não encontrado
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStep?.color ?? "#F59E0B" }}
                />
                <span className="text-xs font-bold text-gray-400  uppercase tracking-wide">
                  Etapa Atual
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ">
                {currentStep?.title ?? "Etapa"}
              </h2>
            </div>

            {/* Título do card */}
            <div className="mb-6 p-5 bg-gray-50  rounded-xl border border-dashed border-gray-300 ">
              <p className="text-xs font-medium text-gray-500  mb-1">
                Nome do Card
              </p>
              <p className="text-sm font-medium text-gray-900 ">
                {card.title}
              </p>
            </div>

            {/* Produto e valor disponíveis para todos os tipos de card (finance e onboarding) */}
            <div className="mb-6 p-5 bg-blue-50  rounded-xl border border-blue-200 ">
              <h3 className="text-sm font-semibold text-gray-900  mb-4">
                Informações Financeiras
              </h3>
              <div className="space-y-4">
                {card.product && (
                  <div>
                    <p className="text-xs font-medium text-gray-500  mb-1">
                      Produto
                    </p>
                    <p className="text-sm text-gray-900 ">
                      {card.product}
                    </p>
                  </div>
                )}
                {card.value !== null && card.value !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-gray-500  mb-1">
                      Valor
                    </p>
                    <p className="text-sm text-gray-900 ">
                      R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Campos de sistema (atribuições) */}
            {renderSystemFields()}

            {/* Campos da etapa */}
            {currentStep?.fields?.length ? (
              <div className="space-y-6">
                {currentStep.fields
                  .filter((field) => !isSystemField(field.slug || ""))
                  .map((field) => renderReadOnlyField(field))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300  bg-gray-50  p-6 text-center">
                <p className="text-sm text-gray-500 ">
                  Nenhum campo configurado nesta etapa.
                </p>
              </div>
            )}
          </div>
        );

      case "history":
        return card ? <CardHistoryTab card={card} /> : null;

      case "comments":
        return (
          <div className="space-y-4 h-[600px]">
            <CardComments cardId={card.id} />
          </div>
        );

      default:
        return null;
    }
  };

  if (!card) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[90vh] max-h-[900px] w-[90vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200  p-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        <DialogTitle className="sr-only">Visualização do Card Pai: {card.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Visualização somente leitura do card pai, incluindo campos, histórico e comentários
        </DialogDescription>

        <div className="flex h-full flex-col bg-white ">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200  flex justify-between items-start shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-500  uppercase tracking-wider">
                  Visualização Somente Leitura
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl font-bold text-gray-900 ">{card.title}</h1>
              </div>
              {currentStep && (
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentStep.color }}
                  />
                  <span className="text-sm font-medium text-gray-600 ">
                    {currentStep.title}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 :text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 :bg-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar de Navegação */}
            <div className="w-64 bg-gray-50  border-r border-gray-200  flex flex-col shrink-0">
              <Tabs
                value={activeSection}
                onValueChange={(value) => setActiveSection(value as ActiveSection)}
                orientation="vertical"
                className="flex-1 flex flex-col"
              >
                <TabsList className="flex-col h-auto w-full bg-transparent p-2 space-y-1">
                  <TabsTrigger
                    value="fields"
                    className="w-full justify-start data-[state=active]:bg-white =active]:bg-gray-700"
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    Campos
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="w-full justify-start data-[state=active]:bg-white =active]:bg-gray-700"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="w-full justify-start data-[state=active]:bg-white =active]:bg-gray-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comentários
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Área de Conteúdo */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

