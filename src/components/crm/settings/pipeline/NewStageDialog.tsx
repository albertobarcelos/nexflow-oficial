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

type NewStageDialogProps = {
  pipelineId: string;
  currentStagesCount: number;
};

export function NewStageDialog({ pipelineId, currentStagesCount }: NewStageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStage, setNewStage] = useState({ name: "", description: "", color: "blue" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStageMutation = useMutation({
    mutationFn: async (stageData: typeof newStage) => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert([
          {
            pipeline_id: pipelineId,
            name: stageData.name,
            description: stageData.description,
            color: stageData.color,
            order_index: currentStagesCount
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
      setNewStage({ name: "", description: "", color: "blue" });
      toast({
        title: "Etapa criada com sucesso!",
        description: "A nova etapa foi adicionada ao pipeline.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar etapa",
        description: "Ocorreu um erro ao criar a etapa. Tente novamente.",
        variant: "destructive",
      });
      console.error('Error creating stage:', error);
    }
  });

  const handleCreateStage = () => {
    if (!newStage.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a etapa.",
        variant: "destructive",
      });
      return;
    }
    createStageMutation.mutate(newStage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Etapa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Etapa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Etapa</Label>
            <Input
              id="name"
              value={newStage.name}
              onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Qualificação"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={newStage.description}
              onChange={(e) => setNewStage(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo desta etapa..."
            />
          </div>
          <Button 
            onClick={handleCreateStage}
            disabled={createStageMutation.isPending}
            className="w-full"
          >
            {createStageMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Criar Etapa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}