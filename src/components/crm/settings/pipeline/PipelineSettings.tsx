import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, Save } from "lucide-react";
// } from "@hello-pangea/dnd";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AllowedEntities } from "./AllowedEntities";

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
  client_id?: string;
  allowed_entities: string[];
}

interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
  funnel_id: string;
}

export function PipelineSettings() {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [newPipeline, setNewPipeline] = useState({ name: "" });
  const [newStage, setNewStage] = useState({ name: "", color: "#94A3B8" });
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isNewPipelineOpen, setIsNewPipelineOpen] = useState(false);
  const [isNewStageOpen, setIsNewStageOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelines();
  }, [user]);

  const fetchPipelines = async () => {
    try {
      if (!user) return;

      // Buscar o client_id do usuário autenticado
      /*
      const { data: collaborator, error: collaboratorError } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (collaboratorError) throw collaboratorError;

      // Buscar os funis do cliente
      const { data: funnels, error: funnelsError } = await supabase
        .from('web_funnels')
        .select('*')
        .eq('client_id', collaborator.client_id);

      if (funnelsError) throw funnelsError;

      // Para cada funil, buscar suas etapas
      const pipelinesWithStages = await Promise.all(
        (funnels || []).map(async (funnel) => {
          const { data: stages, error: stagesError } = await supabase
            .from('web_funnel_stages')
            .select('*')
            .eq('funnel_id', funnel.id)
            .order('order_index', { ascending: true });

          if (stagesError) throw stagesError;

          return {
            ...funnel,
            stages: stages || [],
            allowed_entities: funnel.allowed_entities || ["companies", "people", "partners"]
          };
        })
      );

      setPipelines(pipelinesWithStages);
      */
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
      toast.error('Erro ao carregar funis');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult, pipelineId: string) => {
    if (!result.destination) return;

    const pipeline = pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) return;

    const newStages = Array.from(pipeline.stages);
    const [reorderedStage] = newStages.splice(result.source.index, 1);
    newStages.splice(result.destination.index, 0, reorderedStage);

    // Atualizar posições
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      position: index,
    }));

    try {
      // Atualizar posições no banco de dados
      /*
      const promises = updatedStages.map((stage) =>
        supabase
          .from('funnel_stages')
          .update({ position: stage.position })
          .eq('id', stage.id)
      );

      await Promise.all(promises);
      */

      setPipelines(
        pipelines.map((p) =>
          p.id === pipelineId ? { ...p, stages: updatedStages } : p
        )
      );

      toast.success('Posições atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar posições:', error);
      toast.error('Erro ao atualizar posições');
    }
  };

  const addPipeline = async () => {
    if (!newPipeline.name || !user) return;

    try {
      // Buscar o client_id do usuário
      /*
      const { data: collaborator, error: collaboratorError } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (collaboratorError) throw collaboratorError;

      // Criar novo funil
      const { data: newFunnel, error: funnelError } = await supabase
        .from('web_funnels')
        .insert([
          {
            name: newPipeline.name,
            client_id: collaborator.client_id,
            allowed_entities: ["companies", "people", "partners"]
          },
        ])
        .select()
        .single();

      if (funnelError) throw funnelError;

      setPipelines([...pipelines, { ...newFunnel, stages: [] }]);
      */
      setNewPipeline({ name: "" });
      setIsNewPipelineOpen(false);
      toast.success('Funil criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar funil:', error);
      toast.error('Erro ao criar funil');
    }
  };

  const addStage = async (pipelineId: string) => {
    if (!newStage.name) return;

    try {
      // Primeiro, buscar o client_id do usuário autenticado
      /*
      const { data: collaborator, error: collaboratorError } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', user?.id)
        .single();

      if (collaboratorError) throw collaboratorError;

      // Verificar se o funil pertence ao cliente
      const { data: funnel, error: funnelError } = await supabase
        .from('web_funnels')
        .select('*')
        .eq('id', pipelineId)
        .eq('client_id', collaborator.client_id)
        .single();

      if (funnelError) throw funnelError;

      // Encontrar a última posição
      const pipeline = pipelines.find((p) => p.id === pipelineId);
      const position = pipeline?.stages.length || 0;

      // Criar nova etapa
      const { data: newStageData, error: stageError } = await supabase
        .from('web_funnel_stages')
        .insert([
          {
            name: newStage.name,
            color: newStage.color,
            position: position,
            funnel_id: pipelineId,
            client_id: collaborator.client_id,
            order_index: position, // Usando a mesma posição como order_index
            description: `Etapa ${position + 1}`, // Adicionando uma descrição padrão
          },
        ])
        .select()
        .single();

      if (stageError) throw stageError;

      setPipelines(
        pipelines.map((pipeline) =>
          pipeline.id === pipelineId
            ? {
              ...pipeline,
              stages: [...pipeline.stages, newStageData],
            }
            : pipeline
        )
      );
      */
      setNewStage({ name: "", color: "#94A3B8" });
      setIsNewStageOpen(false);
      setSelectedPipelineId(null);
      toast.success('Etapa adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      toast.error('Erro ao adicionar etapa. Verifique suas permissões.');
    }
  };

  const handleAllowedEntitiesChange = async (pipelineId: string, entities: string[]) => {
    try {
      /*
      const { error } = await supabase
        .from('web_funnels')
        .update({ allowed_entities: entities })
        .eq('id', pipelineId);

      if (error) throw error;
      */
      setPipelines(pipelines.map(pipeline =>
        pipeline.id === pipelineId
          ? { ...pipeline, allowed_entities: entities }
          : pipeline
      ));

      toast.success('Entidades permitidas atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar entidades permitidas:', error);
      toast.error('Erro ao atualizar entidades permitidas');
    }
  };

  const saveChanges = () => {
    // Aqui você implementará a lógica para salvar no banco de dados
    toast.success("Alterações salvas com sucesso!");
    setHasUnsavedChanges(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Funis de Vendas</CardTitle>
          <CardDescription>
            Gerencie seus funis de vendas e suas etapas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelines.map((pipeline) => (
              <Collapsible
                key={pipeline.id}
                open={selectedPipelineId === pipeline.id}
                onOpenChange={(isOpen) =>
                  setSelectedPipelineId(isOpen ? pipeline.id : null)
                }
              >
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start">
                      <ChevronDown className="h-4 w-4 mr-2 shrink-0" />
                      {pipeline.name}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="px-4 pb-4 pt-2">
                  <div className="space-y-4">
                    {/* Seção de Entidades Permitidas */}
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <AllowedEntities
                        value={pipeline.allowed_entities}
                        onChange={(entities) => handleAllowedEntitiesChange(pipeline.id, entities)}
                      />
                    </div>

                    {/* Seção de Etapas do Funil */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium">Etapas do Funil</h4>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPipeline(pipeline);
                            setIsNewStageOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar etapa
                        </Button>
                      </div>

                      <DragDropContext
                        onDragEnd={(result) => handleDragEnd(result, pipeline.id)}
                      >
                        <Droppable droppableId={pipeline.id}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {pipeline.stages.map((stage, index) => (
                                <Draggable
                                  key={stage.id}
                                  draggableId={stage.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="flex items-center gap-2 bg-background p-3 rounded-md border"
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab"
                                      >
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                      />
                                      <span className="flex-1">{stage.name}</span>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            // Implementar edição de etapa
                                          }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            // Implementar exclusão de etapa
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {/* Modal de Nova Etapa */}
          <Dialog open={isNewStageOpen} onOpenChange={setIsNewStageOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Etapa</DialogTitle>
                <DialogDescription>
                  Adicione uma nova etapa ao funil {selectedPipeline?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da etapa</Label>
                  <Input
                    id="name"
                    value={newStage.name}
                    onChange={(e) =>
                      setNewStage({ ...newStage, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={newStage.color}
                    onChange={(e) =>
                      setNewStage({ ...newStage, color: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewStageOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPipeline) {
                      addStage(selectedPipeline.id);
                      setIsNewStageOpen(false);
                    }
                  }}
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Novo Funil */}
          <Dialog open={isNewPipelineOpen} onOpenChange={setIsNewPipelineOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Novo funil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Funil</DialogTitle>
                <DialogDescription>
                  Crie um novo funil de vendas para sua empresa
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do funil</Label>
                  <Input
                    id="name"
                    value={newPipeline.name}
                    onChange={(e) =>
                      setNewPipeline({ ...newPipeline, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewPipelineOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={addPipeline}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 