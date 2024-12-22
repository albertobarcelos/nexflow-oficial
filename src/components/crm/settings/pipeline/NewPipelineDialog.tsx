import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function NewPipelineDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [newPipeline, setNewPipeline] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
  );
}