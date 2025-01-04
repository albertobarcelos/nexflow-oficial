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

export function CreateEntityDialog({ open, onOpenChange, onSuccess }: CreateEntityDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [singularName, setSingularName] = useState("");
  const [pluralName, setPluralName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);

  const handleSubmit = async () => {
    if (!singularName.trim() || !pluralName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha os nomes singular e plural da entidade.",
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

      // Criar a entidade
      const { data: entity, error: entityError } = await supabase
        .from('custom_entities')
        .insert({
          name: singularName,
          description,
          client_id: collaborator.client_id
        })
        .select()
        .single();

      if (entityError) throw entityError;

      // Salvar preferências de nomenclatura
      const { error: namingError } = await supabase
        .from('entity_naming_preferences')
        .insert({
          client_id: collaborator.client_id,
          entity_type: entity.id,
          singular_name: singularName,
          plural_name: pluralName
        });

      if (namingError) throw namingError;

      // Criar campos da entidade
      if (fields.length > 0) {
        const { error: fieldsError } = await supabase
          .from('entity_fields')
          .insert(
            fields.map((field, index) => ({
              ...field,
              entity_id: entity.id,
              client_id: collaborator.client_id,
              order_index: index
            }))
          );

        if (fieldsError) throw fieldsError;
      }

      toast({
        title: "Entidade criada",
        description: "A entidade foi criada com sucesso."
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
      setName("");
      setSingularName("");
      setPluralName("");
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="singularName">Nome no Singular</Label>
              <Input 
                id="singularName" 
                placeholder="Ex: Empresa" 
                value={singularName}
                onChange={(e) => setSingularName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pluralName">Nome no Plural</Label>
              <Input 
                id="pluralName" 
                placeholder="Ex: Empresas" 
                value={pluralName}
                onChange={(e) => setPluralName(e.target.value)}
              />
            </div>
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