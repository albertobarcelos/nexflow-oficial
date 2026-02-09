import { useMemo, useState, useEffect } from "react";
import {
  FileText,
  CheckSquare,
  FileEdit,
  Loader2,
  X,
  Check,
  StickyNote,
  Plus,
  ChevronUp,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexflowCard } from "@/types/nexflow";
import { CardStepAction } from "@/types/nexflow";
import { Database, Json } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCardStepActions } from "@/hooks/useCardStepActions";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { ProcessNote } from "@/types/nexflow";
import { ProcessNoteEditor } from "./ProcessNoteEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type StepActionRow = Database["public"]["Tables"]["step_actions"]["Row"];

interface ProcessWithAction extends CardStepAction {
  stepAction: StepActionRow | null;
}

interface ProcessDetailsProps {
  process: ProcessWithAction;
  card: NexflowCard;
}

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

/** Ícone com badge para seções do accordion */
function AccordionSectionIcon({
  icon: Icon,
  className,
}: {
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center p-2.5 rounded-xl bg-primary/10 text-primary",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function ProcessDetails({ process, card }: ProcessDetailsProps) {
  if (!process) {
    return (
      <main className="flex flex-col h-full overflow-hidden bg-background">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            Processo não disponível
          </p>
        </div>
      </main>
    );
  }

  const cardId = card?.id;
  const {
    completeCardStepAction,
    updateCardStepAction,
    isCompleting,
    isUpdating,
  } = useCardStepActions(cardId);
  const [isCompletingProcess, setIsCompletingProcess] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState("");

  const fieldValues = card?.fieldValues || {};
  const executionData =
    (process?.executionData as Record<string, Json | undefined>) || {};
  const [taskVariables, setTaskVariables] = useState<Record<string, string>>({
    product_name:
      (fieldValues.product_name as string) ||
      (executionData.product_name as string) ||
      "",
    client_name:
      card?.title ||
      (executionData.client_name as string) ||
      "",
    ...(executionData as Record<string, string>),
  });
  const todoItems = process?.stepAction?.checklist_items || [];

  // Notas do processo (executionData.process_notes), com fallback para notes legado
  const [processNotes, setProcessNotes] = useState<ProcessNote[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInEditMode, setNoteInEditMode] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Progresso do checklist (persistido em executionData.checklist_progress)
  const checklistProgressFromData =
    (executionData.checklist_progress as Record<string, boolean>) || {};
  const [checklistProgress, setChecklistProgress] = useState<
    Record<string, boolean>
  >(checklistProgressFromData);

  useEffect(() => {
    const fv = card?.fieldValues || {};
    const ed =
      (process?.executionData as Record<string, Json | undefined>) || {};
    setTaskVariables({
      product_name:
        (fv.product_name as string) || (ed.product_name as string) || "",
      client_name: card?.title || (ed.client_name as string) || "",
      ...(ed as Record<string, string>),
    });
    setChecklistProgress(
      (ed.checklist_progress as Record<string, boolean>) || {}
    );
    // Sincronizar processNotes quando o processo mudar
    const notesFromData =
      (ed.process_notes as unknown as ProcessNote[] | undefined) ?? [];
    const hasLegacy = process?.notes?.trim() && notesFromData.length === 0;
    if (notesFromData.length > 0) {
      setProcessNotes(notesFromData);
    } else if (hasLegacy) {
      setProcessNotes([
        { id: uuidv4(), title: "Nota", content: process?.notes || "" },
      ]);
    } else {
      setProcessNotes([]);
    }
    // Se processo descartado (skipped + nota Descartar), expandir nota por padrão
    const discardNote = notesFromData.find((n) => n.title === "Descartar");
    if (process?.status === "skipped" && discardNote) {
      setEditingNoteId(discardNote.id);
    } else {
      setEditingNoteId(null);
    }
    setNoteInEditMode(null);
    setIsEditorOpen(false);
  }, [
    process?.id,
    process?.status,
    process?.executionData,
    process?.notes,
    card?.title,
    card?.fieldValues,
  ]);

  const isCompleted = process?.status === "completed";
  // Processo descartado = status skipped + nota "Descartar" (banco não permite status "descartado")
  const isDiscarded =
    process?.status === "skipped" &&
    processNotes.some((n) => n.title === "Descartar");
  const scriptTemplate = process?.stepAction?.script_template || "";
  const description = process?.stepAction?.description || "";

  const processedScript = useMemo(() => {
    if (!scriptTemplate) return "";
    const variables: Record<string, string> = {
      product_name: taskVariables.product_name || "[PRODUTO]",
      client_name: taskVariables.client_name || "[CLIENTE]",
      pain_points: taskVariables.pain_points || "[PONTOS RELEVANTES]",
      ...taskVariables,
    };
    let processed = scriptTemplate;
    processed = processed.replace(/\[INSERT PRODUCT NAME\]/gi, variables.product_name);
    processed = processed.replace(/\[INSERT CLIENT NAME\]/gi, variables.client_name);
    processed = processed.replace(
      /\[MENTION PAINS AND RELEVANT POINTS THE CLIENT SAID\]/gi,
      variables.pain_points
    );
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key.toUpperCase().replace(/_/g, " ")}\\]`, "gi");
      processed = processed.replace(regex, value);
      const regexUnderscore = new RegExp(`\\[${key.toUpperCase()}\\]`, "gi");
      processed = processed.replace(regexUnderscore, value);
    });
    return processed;
  }, [scriptTemplate, taskVariables]);

  /** Retorna executionData completo (variáveis + checklist + notas) para persistência */
  const getFullExecutionData = (): Record<string, Json | undefined> => ({
    ...taskVariables,
    checklist_progress: checklistProgress as unknown as Json,
    process_notes: processNotes as unknown as Json,
  });

  const handleAddNote = async () => {
    const title = newNoteTitle.trim() || "Sem título";
    const content = newNoteContent.trim();
    if (!content) {
      toast.error("Adicione um conteúdo à nota.");
      return;
    }
    const newNote: ProcessNote = {
      id: uuidv4(),
      title,
      content,
    };
    const updatedNotes = [...processNotes, newNote];
    setProcessNotes(updatedNotes);
    setNewNoteTitle("");
    setNewNoteContent("");
    setIsEditorOpen(false);
    try {
      await updateCardStepAction({
        id: process.id,
        executionData: {
          ...getFullExecutionData(),
          process_notes: updatedNotes as unknown as Json,
        },
      });
      toast.success("Nota adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      setProcessNotes(processNotes); // Reverte em caso de erro
      toast.error("Erro ao salvar nota. Tente novamente.");
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setTaskVariables((prev) => ({ ...prev, [key]: value }));
  };

  /** Abre modo de edição da nota */
  const handleStartEditNote = (note: ProcessNote) => {
    setNoteInEditMode(note.id);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
  };

  /** Salva edição da nota */
  const handleSaveEditNote = async () => {
    const noteId = noteInEditMode;
    if (!noteId) return;
    const title = editNoteTitle.trim() || "Sem título";
    const content = editNoteContent.trim();
    if (!content) {
      toast.error("Adicione um conteúdo à nota.");
      return;
    }
    const updatedNotes = processNotes.map((n) =>
      n.id === noteId ? { ...n, title, content } : n
    );
    setProcessNotes(updatedNotes);
    setNoteInEditMode(null);
    try {
      await updateCardStepAction({
        id: process.id,
        executionData: {
          ...getFullExecutionData(),
          process_notes: updatedNotes as unknown as Json,
        },
      });
      toast.success("Nota atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      setProcessNotes(processNotes); // Reverte em caso de erro
      setNoteInEditMode(noteId);
      toast.error("Erro ao salvar nota. Tente novamente.");
    }
  };

  /** Cancela edição da nota */
  const handleCancelEditNote = () => {
    setNoteInEditMode(null);
  };

  const handleChecklistToggle = async (index: number, checked: boolean) => {
    const newProgress = {
      ...checklistProgress,
      [String(index)]: checked,
    };
    setChecklistProgress(newProgress);
    try {
      await updateCardStepAction({
        id: process.id,
        executionData: {
          ...taskVariables,
          checklist_progress: newProgress,
          process_notes: processNotes as unknown as Json,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      setChecklistProgress(checklistProgress); // Reverte em caso de erro
    }
  };

  const handleComplete = async () => {
    if (isCompleted || isCompletingProcess) return;
    setIsCompletingProcess(true);
    try {
      // Concatena conteúdo das notas para o campo notes legado (opcional)
      const notesLegacy =
        processNotes.length > 0
          ? processNotes
              .map((n) => `## ${n.title}\n${n.content}`)
              .join("\n\n")
          : undefined;
      await completeCardStepAction({
        id: process.id,
        notes: notesLegacy,
        executionData: getFullExecutionData(),
      });
      toast.success("Processo concluído com sucesso!");
    } catch (error) {
      console.error("Erro ao completar processo:", error);
      toast.error("Erro ao completar processo. Tente novamente.");
    } finally {
      setIsCompletingProcess(false);
    }
  };

  /** Abre modal para digitar motivo do descarte */
  const handleOpenDiscardModal = () => {
    setDiscardReason("");
    setIsDiscardModalOpen(true);
  };

  /** Confirma descarte: cria nota "Descartar" com motivo e altera status */
  const handleConfirmDiscard = async () => {
    const reason = discardReason.trim();
    if (!reason) {
      toast.error("Informe o motivo do descarte.");
      return;
    }
    const discardNote: ProcessNote = {
      id: uuidv4(),
      title: "Descartar",
      content: reason,
    };
    const updatedNotes = [...processNotes, discardNote];
    try {
      // Usa "skipped" pois a constraint do banco só permite: pending, in_progress, completed, skipped
      await updateCardStepAction({
        id: process.id,
        status: "skipped",
        executionData: {
          ...getFullExecutionData(),
          process_notes: updatedNotes as unknown as Json,
        },
      });
      setProcessNotes(updatedNotes);
      setEditingNoteId(discardNote.id);
      setIsDiscardModalOpen(false);
      setDiscardReason("");
    } catch (error) {
      console.error("Erro ao descartar processo:", error);
      toast.error("Erro ao descartar processo. Tente novamente.");
    }
  };

  /** Reativa o processo alterando status de completed/descartado para pending */
  const handleReactivate = async () => {
    if ((!isCompleted && !isDiscarded) || isUpdating) return;
    try {
      await updateCardStepAction({
        id: process.id,
        status: "pending",
      });
      toast.success("Processo reativado com sucesso!");
    } catch (error) {
      console.error("Erro ao reativar processo:", error);
      toast.error("Erro ao reativar processo. Tente novamente.");
    }
  };

  return (
    <main className="flex flex-col w-full h-full overflow-hidden bg-card rounded-2xl border border-border">
      {/* Header centralizado */}
      <header className="p-4 text-center border-b border-border flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">
          {process?.stepAction?.title || "Processo sem título"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          {getActionTypeLabel(process.stepAction?.action_type ?? null)} e
          Diretrizes
        </p>
        
        
        
        {/* Badge de processo concluído + botão reativar */}
        {isCompleted && (
          <div className="mt-4 inline-flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
              <span className="text-sm font-semibold">Processo Concluído</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReactivate}
              disabled={isUpdating}
              title="Reativar processo"
              className="h-9 px-3 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
        {/* Badge de processo descartado + botão reativar */}
        {isDiscarded && (
          <div className="mt-4 inline-flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive">
              <X className="h-5 w-5" />
              <span className="text-sm font-semibold">Processo Descartado</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReactivate}
              disabled={isUpdating}
              title="Reativar processo"
              className="h-9 px-3 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </header>

      {/* Accordion */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Accordion
          type="single"
          collapsible
          defaultValue="scripts"
          className="w-full"
        >
          <AccordionItem value="scripts" className="border-b border-border">
            <AccordionTrigger className="px-6 py-4 m-2 rounded-xl bg-gray-100 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-primary/5 outline-gray-200">
              <div className="flex items-center gap-4">
                <AccordionSectionIcon icon={FileText} />
                <span className="text-lg font-semibold text-foreground tracking-wide uppercase">
                  Scripts
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 m-2 rounded-xl bg-muted/30">
              {description && (
                <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-foreground font-medium">
                    Objetivo: {description}
                  </p>
                </div>
              )}
              {scriptTemplate ? (
                <div
                  className="text-base text-foreground whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: processedScript
                      .split("\n")
                      .map((line) =>
                        line.replace(
                          /\[([^\]]+)\]/g,
                          '<span class="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded font-mono text-sm border border-yellow-200">[$1]</span>'
                        )
                      )
                      .join("<br/>"),
                  }}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum script configurado para este processo
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="checklist" className="border-b border-border">
            <AccordionTrigger className="px-6 py-4 m-2 rounded-xl bg-gray-100 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-primary/5 outline-gray-200">
              <div className="flex items-center gap-4">
                <AccordionSectionIcon icon={CheckSquare} />
                <span className="text-lg font-semibold text-foreground tracking-wide uppercase">
                  Check List
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 m-2 rounded-xl bg-muted/30">
              <div className="pt-2 space-y-2">
                {todoItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa adicionada
                  </p>
                ) : (
                  todoItems.map((item, index) => {
                    const checkboxId = `checklist-${process.id}-${index}`;
                    return (
                    <label
                      key={index}
                      htmlFor={checkboxId}
                      className="flex items-center gap-3 text-sm text-foreground cursor-pointer select-none py-1"
                    >
                      <Checkbox
                        id={checkboxId}
                        className="rounded border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                        checked={checklistProgress[String(index)] === true}
                        onCheckedChange={(checked) =>
                          handleChecklistToggle(index, checked === true)
                        }
                        disabled={isCompleted || isDiscarded}
                      />
                      <span
                        className={cn(
                          checklistProgress[String(index)] && "line-through text-muted-foreground"
                        )}
                      >
                        {item}
                      </span>
                    </label>
                  );})
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notes" className="border-b border-border">
            <AccordionTrigger className="px-6 py-4 m-2 rounded-xl bg-gray-100 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:bg-primary/5 outline-gray-200">
              <div className="flex items-center gap-4">
                <AccordionSectionIcon icon={FileEdit} />
                <span className="text-lg font-semibold text-foreground tracking-wide uppercase">
                  Notas
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 bg-muted/30">
              <div className="pt-2 space-y-4">
                {/* Botão Adicionar nota / Editor colapsável */}
                {!isEditorOpen ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditorOpen(true)}
                    className="h-8 px-3 text-xs text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar nota
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditorOpen(false)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Fechar editor
                      </Button>
                    </div>
                    <Input
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      placeholder="Título da nota"
                      className="w-full bg-background text-sm h-9"
                    />
                    <ProcessNoteEditor
                      value={newNoteContent}
                      onChange={setNewNoteContent}
                      placeholder="Digite em Markdown... *itálico*, **negrito**, listas, etc."
                      minHeight={100}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddNote}
                      className="h-8 px-3 text-xs text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Salvar Nota
                    </Button>
                  </div>
                )}

                {/* Lista de Notas - título + ícone à direita, ao clicar expande conteúdo */}
                {processNotes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Notas salvas
                    </p>
                    {processNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border border-border bg-background overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setEditingNoteId((prev) =>
                              prev === note.id ? null : note.id
                            )
                          }
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground truncate flex-1">
                            {note.title}
                          </span>
                          <StickyNote className="h-4 w-4 text-primary shrink-0 ml-2" />
                        </button>
                        {editingNoteId === note.id && (
                          <div className="px-4 pb-4 pt-1 border-t border-border">
                            {noteInEditMode === note.id ? (
                              <div className="space-y-3 pt-2">
                                <Input
                                  value={editNoteTitle}
                                  onChange={(e) => setEditNoteTitle(e.target.value)}
                                  placeholder="Título da nota"
                                  className="w-full bg-background text-sm h-9"
                                />
                                <ProcessNoteEditor
                                  value={editNoteContent}
                                  onChange={setEditNoteContent}
                                  placeholder="Digite em Markdown..."
                                  minHeight={100}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEditNote}
                                    className="h-8 px-3 text-xs"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveEditNote}
                                    disabled={isUpdating}
                                    className="h-8 px-3 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                  >
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2 pt-1">
                                <div className="flex-1 min-w-0">
                                  <MarkdownPreview content={note.content} />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditNote(note);
                                  }}
                                  className="h-8 px-2 shrink-0 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Editar nota"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          
        </Accordion>
      </div>

      {/* Footer DESCARTAR e FINALIZA */}
      {!isCompleted && !isDiscarded && (
        <div className="p-4 bg-muted/30 border-t border-border flex justify-between gap-4 flex-shrink-0">
          <Button
            variant="destructive"
            onClick={handleOpenDiscardModal}
            className="flex-1 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider border-2 border-destructive hover:bg-red-600"
          >
            <X className="h-5 w-5 mr-2" />
            Descartar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCompletingProcess || isCompleting}
            className="flex-1 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white"
          >
            {isCompletingProcess || isCompleting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Finalizando...
              </>
            ) : (
              <>
                Finaliza
                <Check className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Modal de motivo do descarte */}
      <Dialog open={isDiscardModalOpen} onOpenChange={setIsDiscardModalOpen}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="discard-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Descartar processo</DialogTitle>
            <DialogDescription id="discard-dialog-description">
              Informe o motivo do descarte. O motivo será registrado como nota no
              processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Digite o motivo do descarte..."
              value={discardReason}
              onChange={(e) => setDiscardReason(e.target.value)}
              className="min-h-[120px]"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDiscardModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDiscard}
              disabled={isUpdating}
            >
              Confirmar descarte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
