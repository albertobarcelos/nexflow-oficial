import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, AlignEndHorizontal } from "lucide-react";
import NewStage, { Stage } from "./NewStage";
import ChooseBase from "./ChooseBase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { getCurrentUserData } from "@/lib/auth";
import { toast } from "sonner";
import { useFlowBuilder } from "@/contexts/FlowBuilderContext";

// Componente para item draggable usando @dnd-kit
function SortableStageRow({ 
  stage, 
  index, 
  onEdit, 
  onDelete 
}: { 
  stage: Stage; 
  index: number; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `stage-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b last:border-b-0 transition-colors ${isDragging ? 'bg-blue-50' : 'hover:bg-[#f1f5f9]'}`}
    >
      <td className="p-3 align-middle cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </td>
      <td className="p-3 font-medium">{stage.name}</td>
      <td className="p-3 text-center">
        <span 
          className="inline-block w-6 h-6 rounded-full border" 
          style={{ background: stage.color }} 
        />
      </td>
      <td className="p-3">{stage.description}</td>
      <td className="p-3 text-right">
        <button 
          className="inline-flex items-center p-1 hover:bg-gray-100 rounded" 
          title="Editar" 
          onClick={onEdit}
        >
          <Pencil className="w-4 h-4 text-gray-500" />
        </button>
        <button 
          className="inline-flex items-center p-1 hover:bg-gray-100 rounded ml-2" 
          title="Excluir" 
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 text-gray-500" />
        </button>
      </td>
    </tr>
  );
}

const NewFlowSettings: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { 
        title: flowTitle, 
        stages, 
        setStages,
        addStage, 
        updateStage, 
        removeStage, 
        resetFlow 
    } = useFlowBuilder();

    // Redireciona se a página for acessada sem um título de flow
    useEffect(() => {
        if (!flowTitle) {
            navigate("/crm");
        }
    }, [flowTitle, navigate]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [stageDraft, setStageDraft] = useState<Stage | undefined>(undefined);
    const [chooseBaseOpen, setChooseBaseOpen] = useState(false);
    const [selectedBases, setSelectedBases] = useState<string[]>([]);
    const [confirmBase, setConfirmBase] = useState<string | null>(null);
    const [confirmStageIdx, setConfirmStageIdx] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Configuração dos sensores para @dnd-kit
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const openNewStageModal = () => {
        setEditingIndex(null);
        setStageDraft(undefined);
        setModalOpen(true);
    };

    const openEditStageModal = (idx: number) => {
        setEditingIndex(idx);
        setStageDraft(stages[idx]);
        setModalOpen(true);
    };

    const handleSaveStage = (stage: Stage) => {
        if (editingIndex === null) {
            addStage(stage);
        } else {
            updateStage(editingIndex, stage);
        }
        setModalOpen(false);
    };

    const handleDeleteStage = (idx: number) => {
        removeStage(idx);
        setConfirmStageIdx(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = stages.findIndex((_, index) => `stage-${index}` === active.id);
            const newIndex = stages.findIndex((_, index) => `stage-${index}` === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                setStages(arrayMove(stages, oldIndex, newIndex));
            }
        }
    };

    const handleSelectBase = (base: string) => {
        setSelectedBases((prev) => prev.includes(base) ? prev : [...prev, base]);
    };

    const handleConfirmDeleteBase = () => {
        if (confirmBase) {
            setSelectedBases(bases => bases.filter(b => b !== confirmBase));
            setConfirmBase(null);
        }
    };

    const handleSaveFlow = async () => {
        // Prevenir múltiplos cliques
        if (isSaving) {
            console.log("⏳ Salvamento já em andamento, ignorando clique...");
            return;
        }

        // Validação inicial
        if (!flowTitle || !flowTitle.trim()) {
            toast.error("O nome do flow é obrigatório");
            return;
        }

        setIsSaving(true);
        try {

            const user = await getCurrentUserData();
            if (!user?.client_id || !user?.id) {
                console.error("❌ Erro: Usuário inválido", { user });
                throw new Error("Usuário inválido. Verifique se está autenticado.");
            }

            // Preparar payload do flow - remover campos undefined
            const flowName = capitalize(flowTitle.trim());
            const flowPayload: {
                client_id: string;
                name: string;
                created_by: string;
                description?: string | null;
            } = {
                client_id: user.client_id,
                name: flowName,
                created_by: user.id,
            };

            // Adicionar description apenas se existir
            // (assumindo que description é opcional na tabela)

            console.log("📝 Tentando criar flow com payload:", {
                client_id: flowPayload.client_id,
                name: flowPayload.name,
                created_by: flowPayload.created_by,
                stagesCount: stages.length,
            });

            // 1. Criar o flow
            const { data: flow, error: flowError } = await supabase
                .from("web_flows")
                .insert(flowPayload)
                .select()
                .single();

            if (flowError) {
                console.error("❌ Erro completo ao salvar flow:", {
                    error: flowError,
                    errorCode: flowError.code,
                    errorMessage: flowError.message,
                    errorDetails: flowError.details,
                    errorHint: flowError.hint,
                    flowData: {
                        client_id: flowPayload.client_id,
                        name: flowPayload.name,
                        created_by: flowPayload.created_by,
                    },
                    stagesCount: stages.length,
                });
                throw flowError;
            }

            if (!flow) {
                console.error("❌ Flow não foi criado - resposta vazia");
                throw new Error("Erro ao criar flow: resposta vazia do servidor");
            }

            console.log("✅ Flow criado com sucesso:", { flowId: flow.id, flowName: flow.name });

            // 2. Criar as etapas
            if (stages.length > 0) {
                const validStages = stages.filter((stage, idx) => {
                    const hasName = Boolean(stage.name?.trim());
                    if (!hasName) {
                        console.warn(`⚠️ Etapa ${idx + 1} sem nome, pulando...`);
                    }
                    return hasName;
                });

                const stageInserts = validStages.map((stage, idx) => ({
                    client_id: user.client_id,
                    flow_id: flow.id,
                    name: stage.name!.trim(),
                    description: stage.description?.trim() || null,
                    color: stage.color || "#6B7280",
                    order_index: idx + 1,
                }));

                if (stageInserts.length > 0) {
                    console.log(`📝 Criando ${stageInserts.length} etapa(s)...`);

                    // Usar web_flow_stages (correção: estava usando web_funnel_stages)
                    const { error: stagesError } = await supabase
                        .from("web_flow_stages")
                        .insert(stageInserts);

                    if (stagesError) {
                        console.error("❌ Erro ao criar etapas:", {
                            error: stagesError,
                            errorCode: stagesError.code,
                            errorMessage: stagesError.message,
                            errorDetails: stagesError.details,
                            stagesCount: stageInserts.length,
                        });
                        // Continua mesmo se houver erro nas etapas, mas avisa o usuário
                        toast.warning("Flow criado, mas houve erro ao criar algumas etapas");
                    } else {
                        console.log("✅ Etapas criadas com sucesso");
                    }
                }
            }

            toast.success("Flow criado com sucesso!");
            resetFlow();
            navigate(`/crm/flow/${flow.id}`);
        } catch (err: unknown) {
            // Tratamento detalhado de erros
            let errorMessage = "Erro ao salvar flow";
            
            if (err instanceof Error) {
                errorMessage = err.message;
                console.error("❌ Erro capturado:", {
                    message: err.message,
                    name: err.name,
                    stack: err.stack,
                });
            } else if (typeof err === "object" && err !== null) {
                // Erro do Supabase
                const supabaseError = err as any;
                console.error("❌ Erro do Supabase:", {
                    code: supabaseError.code,
                    message: supabaseError.message,
                    details: supabaseError.details,
                    hint: supabaseError.hint,
                });
                
                // Mensagens mais específicas baseadas no código de erro
                if (supabaseError.code === "23505") {
                    errorMessage = "Já existe um flow com este nome";
                } else if (supabaseError.code === "42501") {
                    errorMessage = "Sem permissão para criar flows. Verifique suas permissões.";
                } else if (supabaseError.message) {
                    errorMessage = supabaseError.message;
                }
            } else {
                console.error("❌ Erro desconhecido:", err);
            }

            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 mx-auto bg-[#f0f3fd] min-h-screen">
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <AlignEndHorizontal className="w-5 h-5 text-neutral-700" />
                    <span className="text-[20px] font-semibold text-neutral-900">Novo Flow</span>
                </div>
                <Button
                    className="bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-600 hover:border-orange-500 transition-colors"
                    size="sm"
                    onClick={handleSaveFlow}
                    disabled={isSaving || !flowTitle?.trim() || stages.length === 0}
                >
                    {isSaving ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Salvando...
                        </>
                    ) : (
                        "Salvar"
                    )}
                </Button>
            </div>
            <div className="mt-1 text-[22px] ml-6 font-semibold text-orange-500 italic">{capitalize(flowTitle)}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Etapas - 2/3 */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Etapas</h2>
                            <Button
                                onClick={openNewStageModal}
                                size="sm"
                                className="bg-blue-900 rounded-full text-white hover:bg-orange-500 hover:text-white transition-colors"
                            >Nova Etapa</Button>
                        </div>
                        {stages.length === 0 ? (
                            <div className="text-muted-foreground">Nenhuma etapa adicionada ainda.</div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <table className="w-full text-sm border-separate border-spacing-0 rounded-xl overflow-hidden bg-white">
                                    <thead>
                                        <tr className="bg-[#f8fafc] text-gray-700">
                                            <th className="p-2 text-left w-8"></th>
                                            <th className="p-2 text-left">Nome</th>
                                            <th className="p-2 text-center">Cor</th>
                                            <th className="p-2 text-left">Descrição</th>
                                            <th className="p-2 text-right w-20">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <SortableContext 
                                            items={stages.map((_, index) => `stage-${index}`)} 
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {stages.map((stage, idx) => (
                                                <SortableStageRow
                                                    key={`stage-${idx}`}
                                                    stage={stage}
                                                    index={idx}
                                                    onEdit={() => openEditStageModal(idx)}
                                                    onDelete={() => setConfirmStageIdx(idx)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </tbody>
                                </table>
                            </DndContext>
                        )}
                    </div>
                </div>
                {/* Bases de Dados - 1/3 */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Bases de Dados</h2>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setChooseBaseOpen(true)}
                                className="bg-blue-900 rounded-full text-white hover:bg-orange-500 hover:text-white transition-colorsrange-500 transition-colors"
                            >Escolher Base</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedBases.length === 0 && (
                                <span className="text-muted-foreground">Nenhuma base selecionada.</span>
                            )}
                            <TooltipProvider>
                                {selectedBases.map((base) => (
                                    <Tooltip key={base} delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <span
                                                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-600 cursor-pointer hover:bg-blue-200 transition-colors"
                                                onClick={() => setConfirmBase(base)}
                                            >
                                                {base}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            Clique para deletar base de dados...
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            </div>
            <NewStage
                open={modalOpen}
                onOpenChange={setModalOpen}
                initialStage={stageDraft}
                onSave={handleSaveStage}
            />
            <ChooseBase
                open={chooseBaseOpen}
                onOpenChange={setChooseBaseOpen}
                onSelectBase={handleSelectBase}
            />
            <Dialog open={!!confirmBase} onOpenChange={open => !open && setConfirmBase(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover base de dados?</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">Tem certeza que deseja remover a base <span className="font-semibold text-blue-600">{confirmBase}</span> deste Flow?</div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConfirmBase(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDeleteBase}>Remover</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={confirmStageIdx !== null} onOpenChange={open => !open && setConfirmStageIdx(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover etapa?</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">Tem certeza que deseja remover esta etapa do Flow?</div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConfirmStageIdx(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => confirmStageIdx !== null && handleDeleteStage(confirmStageIdx)}>Remover</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NewFlowSettings;
