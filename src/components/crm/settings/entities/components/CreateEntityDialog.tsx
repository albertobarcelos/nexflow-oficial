import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateEntityDialogProps } from "../types";
import { EntityFieldEditor } from "./EntityFieldEditor";

export function CreateEntityDialog({ open, onOpenChange }: CreateEntityDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a entidade.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Cliente não encontrado');

      const { error } = await supabase
        .from('custom_entities')
        .insert({
          name,
          description,
          fields,
          client_id: collaborator.client_id
        });

      if (error) throw error;

      toast({
        title: "Entidade criada",
        description: "A entidade foi criada com sucesso."
      });
      
      onOpenChange(false);
      setName("");
      setDescription("");
      setFields([]);
    } catch (error) {
      console.error('Error creating entity:', error);
      toast({
        title: "Erro ao criar entidade",
        description: "Ocorreu um erro ao criar a entidade. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Entidade</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Entidade</Label>
            <Input 
              id="name" 
              placeholder="Ex: Parceiros" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito desta entidade"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Campos</Label>
            <EntityFieldEditor fields={fields} onChange={setFields} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar Entidade"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}