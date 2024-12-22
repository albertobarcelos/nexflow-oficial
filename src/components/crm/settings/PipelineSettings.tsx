import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GripVertical, Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function PipelineSettings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPipeline, setNewPipeline] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipeline_configs'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data: pipelineConfigs } = await supabase
        .from('pipeline_configs')
        .select(`
          *,
          pipeline_stages (
            *
          )
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: true });

      return pipelineConfigs;
    }
  });

  const createPipelineMutation = useMutation({
    mutationFn: async (pipelineData: { name: string; description: string }) => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data, error } = await supabase
        .from('pipeline_configs')
        .insert([
          {
            client_id: collaborator.client_id,
            name: pipelineData.name,
            description: pipelineData.description
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_configs'] });
      setIsDialogOpen(false);
      setNewPipeline({ name: "", description: "" });
      toast({
        title: "Pipeline criado com sucesso!",
        description: "O novo pipeline foi adicionado às suas configurações.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar pipeline",
        description: "Ocorreu um erro ao criar o pipeline. Tente novamente.",
        variant: "destructive",
      });
      console.error('Error creating pipeline:', error);
    }
  });

  const handleCreatePipeline = () => {
    if (!newPipeline.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o pipeline.",
        variant: "destructive",
      });
      return;
    }
    createPipelineMutation.mutate(newPipeline);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pipelines</h2>
          <p className="text-muted-foreground">
            Configure seus pipelines de vendas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Pipeline</Label>
                <Input
                  id="name"
                  value={newPipeline.name}
                  onChange={(e) => setNewPipeline(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pipeline Principal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={newPipeline.description}
                  onChange={(e) => setNewPipeline(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo deste pipeline..."
                />
              </div>
              <Button 
                onClick={handleCreatePipeline}
                disabled={createPipelineMutation.isPending}
                className="w-full"
              >
                {createPipelineMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Pipeline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {pipelines?.map((pipeline) => (
          <Card key={pipeline.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{pipeline.name}</CardTitle>
                {pipeline.description && (
                  <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Etapa
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto p-4">
                {pipeline.pipeline_stages?.map((stage) => (
                  <Card key={stage.id} className={`w-64 shrink-0 border-2 border-${stage.color}-200`}>
                    <CardHeader className="flex flex-row items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-sm">{stage.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}