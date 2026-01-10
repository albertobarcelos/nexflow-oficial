import { useMemo, useState, useEffect } from "react";
import { Phone, Mail, MessageSquare, Calendar, CheckSquare, Info, AlertTriangle, CheckCircle2, History, HelpCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NexflowCard } from "@/types/nexflow";
import { CardStepAction } from "@/types/nexflow";
import { Database, Json } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCardStepActions } from "@/hooks/useCardStepActions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type StepActionRow = Database["public"]["Tables"]["step_actions"]["Row"];

interface ProcessWithAction extends CardStepAction {
  stepAction: StepActionRow | null;
}

interface ProcessDetailsProps {
  process: ProcessWithAction;
  card: NexflowCard;
}

const getActionIcon = (actionType: string | null) => {
  switch (actionType) {
    case "phone_call":
      return Phone;
    case "email":
      return Mail;
    case "linkedin_message":
    case "whatsapp":
      return MessageSquare;
    case "meeting":
      return Calendar;
    case "task":
      return CheckSquare;
    default:
      return CheckSquare;
  }
};

const getActionTypeLabel = (actionType: string | null) => {
  switch (actionType) {
    case "phone_call":
      return "Ligação";
    case "email":
      return "E-mail";
    case "linkedin_message":
      return "Mensagem LinkedIn";
    case "whatsapp":
      return "WhatsApp";
    case "meeting":
      return "Reunião";
    case "task":
      return "Tarefa";
    default:
      return "Processo";
  }
};

export function ProcessDetails({ process, card }: ProcessDetailsProps) {
  // Verificar se process existe
  if (!process) {
    return (
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Processo não disponível
          </p>
        </div>
      </main>
    );
  }

  // Verificar se card existe, mas permitir uso mesmo se id ainda não estiver disponível
  const cardId = card?.id;
  
  const { completeCardStepAction, updateCardStepAction, isCompleting } = useCardStepActions(cardId);
  const [isCompletingProcess, setIsCompletingProcess] = useState(false);
  
  // Estados para variáveis e notas
  const fieldValues = card?.fieldValues || {};
  const executionData = (process?.executionData as Record<string, Json | undefined>) || {};
  const [taskVariables, setTaskVariables] = useState<Record<string, string>>({
    product_name: (fieldValues.product_name as string) || executionData.product_name as string || "",
    client_name: card?.title || executionData.client_name as string || "",
    ...executionData as Record<string, string>,
  });
  const [notes, setNotes] = useState(process?.notes || "");
  const [todoItems, setTodoItems] = useState<string[]>(
    process?.stepAction?.checklist_items || []
  );

  // Sincronizar estados quando o processo mudar
  useEffect(() => {
    const fieldValues = card?.fieldValues || {};
    const executionData = (process?.executionData as Record<string, Json | undefined>) || {};
    setTaskVariables({
      product_name: (fieldValues.product_name as string) || executionData.product_name as string || "",
      client_name: card?.title || executionData.client_name as string || "",
      ...executionData as Record<string, string>,
    });
    setNotes(process?.notes || "");
    setTodoItems(process?.stepAction?.checklist_items || []);
  }, [process?.id, process?.executionData, process?.notes, process?.stepAction?.checklist_items, card?.title, card?.fieldValues]);

  const Icon = getActionIcon(process?.stepAction?.action_type ?? null);
  const isCompleted = process?.status === "completed";
  const scriptTemplate = process?.stepAction?.script_template || "";
  const description = process?.stepAction?.description || "";

  // Substituir variáveis no template
  const processedScript = useMemo(() => {
    if (!scriptTemplate) return "";
    
    // Usar taskVariables para substituição
    const variables: Record<string, string> = {
      product_name: taskVariables.product_name || "[PRODUTO]",
      client_name: taskVariables.client_name || "[CLIENTE]",
      pain_points: taskVariables.pain_points || "[PONTOS RELEVANTES]",
      ...taskVariables,
    };
    
    // Substituir variáveis no formato [VARIABLE_NAME] ou [INSERT VARIABLE NAME]
    let processed = scriptTemplate;
    
    // Substituir padrões comuns
    processed = processed.replace(/\[INSERT PRODUCT NAME\]/gi, variables.product_name);
    processed = processed.replace(/\[INSERT CLIENT NAME\]/gi, variables.client_name);
    processed = processed.replace(/\[MENTION PAINS AND RELEVANT POINTS THE CLIENT SAID\]/gi, variables.pain_points);
    
    // Substituir variáveis genéricas no formato [VARIABLE_NAME]
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key.toUpperCase().replace(/_/g, ' ')}\\]`, 'gi');
      processed = processed.replace(regex, value);
      
      // Também substituir formato com underscores
      const regexUnderscore = new RegExp(`\\[${key.toUpperCase()}\\]`, 'gi');
      processed = processed.replace(regexUnderscore, value);
    });
    
    return processed;
  }, [scriptTemplate, taskVariables]);

  const handleSaveNotes = async () => {
    try {
      await updateCardStepAction({
        id: process.id,
        notes: notes || null,
        executionData: taskVariables,
      });
      toast.success("Notas salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
      toast.error("Erro ao salvar notas. Tente novamente.");
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setTaskVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleComplete = async () => {
    if (isCompleted || isCompletingProcess) return;

    setIsCompletingProcess(true);
    try {
      await completeCardStepAction({
        id: process.id,
        notes: notes || undefined,
        executionData: taskVariables,
      });
      toast.success("Processo concluído com sucesso!");
    } catch (error) {
      console.error("Erro ao completar processo:", error);
      toast.error("Erro ao completar processo. Tente novamente.");
    } finally {
      setIsCompletingProcess(false);
    }
  };

  const handleMarkAsFailed = async () => {
    // TODO: Implementar marcação como falhado
    toast.info("Funcionalidade em desenvolvimento");
  };

  return (
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 px-8 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {process?.stepAction?.title || "Processo sem título"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {getActionTypeLabel(process.stepAction?.action_type ?? null)} e Diretrizes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <History className="h-5 w-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 w-full">
          {/* Card Informativo */}
          {description && (
            <div className="bg-blue-50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-lg p-4 mb-6 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <p className="font-medium mb-1">Objetivo: {description}</p>
              </div>
            </div>
          )}

          {/* Script Template */}
          {scriptTemplate && (
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <div
                className="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: processedScript
                    .split("\n")
                    .map((line) => {
                      // Destacar variáveis não substituídas (ainda com [])
                      const highlighted = line.replace(
                        /\[([^\]]+)\]/g,
                        '<span class="bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200 text-yellow-800 px-1 py-0.5 rounded font-mono text-sm border border-yellow-200 dark:border-yellow-800">[$1]</span>'
                      );
                      return highlighted;
                    })
                    .join("<br/>"),
                }}
              />
            </article>
          )}
          
          {!scriptTemplate && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum script configurado para este processo
              </p>
            </div>
          )}

          {/* Alertas de Ação */}
          {process?.stepAction?.is_required && (
            <div className="my-6 p-4 bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-400 rounded-r-md">
              <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                Ação Requerida
              </p>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100 italic">
                Este processo é obrigatório para avançar no fluxo
              </p>
            </div>
          )}

          {/* Métrica de Sucesso */}
          {isCompleted && (
            <div className="my-6 p-4 bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 rounded-r-md">
              <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                Processo Concluído
              </p>
              <p className="text-sm font-medium text-green-900 dark:text-green-100 italic">
                Este processo foi concluído com sucesso
              </p>
            </div>
          )}

          <div className="h-20"></div>
        </div>

        {/* Sidebar Direita */}
        <div className={cn(
          "w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto custom-scrollbar p-6",
          !isCompleted && "pb-28"
        )}>
          {/* Task Variables */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Variáveis da Tarefa
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Produto
                </label>
                <Input
                  value={taskVariables.product_name || ""}
                  onChange={(e) => handleVariableChange("product_name", e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Cliente
                </label>
                <Input
                  value={taskVariables.client_name || ""}
                  onChange={(e) => handleVariableChange("client_name", e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Linked Notes */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Notas Vinculadas
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-300 resize-y min-h-[80px]"
                placeholder="Adicione notas relacionadas a esta tarefa..."
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSaveNotes}
                  className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  Salvar Nota
                </button>
              </div>
            </div>
          </div>

          {/* To-Do List */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              Lista de Tarefas
              <button className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </h3>
            <div className="space-y-3">
              {todoItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  Nenhuma tarefa adicionada
                </p>
              ) : (
                todoItems.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-700 dark:border-slate-600 h-4 w-4 mt-1"
                      id={`todo-${index}`}
                    />
                    <label
                      htmlFor={`todo-${index}`}
                      className="ml-2 text-sm text-slate-700 dark:text-slate-300 flex-1"
                    >
                      {item}
                    </label>
                    <button className="text-slate-400 hover:text-red-500 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer com Ações */}
      {!isCompleted && (
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg flex items-center gap-4 z-20">
          <Button
            onClick={handleComplete}
            disabled={isCompletingProcess || isCompleting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isCompletingProcess || isCompleting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Concluindo...
              </>
            ) : (
              <>
                <Icon className="h-5 w-5" />
                {taskVariables.client_name ? `Completar ${taskVariables.client_name}` : "Concluir Processo"}
              </>
            )}
          </Button>
          <button className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <History className="h-5 w-5" />
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
          <button
            onClick={handleMarkAsFailed}
            className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 text-sm font-medium px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Marcar como Falhado
          </button>
          <div className="flex-1"></div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all hover:-translate-y-1">
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      )}
    </main>
  );
}

