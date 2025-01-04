import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EntityBasicInfo } from "./form/EntityBasicInfo";
import { EntityVisualConfig } from "./form/EntityVisualConfig";
import { EntityFieldEditor } from "./EntityFieldEditor";
import { ConfiguredFieldsTable } from "./ConfiguredFieldsTable";
import { useEntities } from "../hooks/useEntities";
import type { CreateEntityDialogProps } from "../types";

export function CreateEntityDialog({ open, onOpenChange, onSuccess, entityToEdit }: CreateEntityDialogProps) {
  const { toast } = useToast();
  const { entities } = useEntities();
  const [isLoading, setIsLoading] = useState(false);
  const [singularName, setSingularName] = useState("");
  const [pluralName, setPluralName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [selectedIcon, setSelectedIcon] = useState("database");
  const [selectedColor, setSelectedColor] = useState("#4A90E2");

  useEffect(() => {
    if (entityToEdit) {
      setSingularName(entityToEdit.name);
      setPluralName(entityToEdit.name + 's'); // Simplificado para exemplo
      setDescription(entityToEdit.description || "");
      setSelectedIcon(entityToEdit.icon_name || "database");
      setSelectedColor(entityToEdit.color || "#4A90E2");
      setFields(entityToEdit.fields || []);
    } else {
      setSingularName("");
      setPluralName("");
      setDescription("");
      setSelectedIcon("database");
      setSelectedColor("#4A90E2");
      setFields([]);
    }
  }, [entityToEdit]);

  const handleSubmit = async () => {
    if (!singularName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome singular da entidade.",
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

      if (entityToEdit) {
        // Atualizar entidade existente
        const { error: entityError } = await supabase
          .from('custom_entities')
          .update({
            name: singularName,
            description,
            icon_name: selectedIcon,
            color: selectedColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', entityToEdit.id);

        if (entityError) throw entityError;

        // Atualizar campos existentes e adicionar novos
        for (const field of fields) {
          if (field.id.includes('temp-')) {
            // Novo campo
            const { error: fieldError } = await supabase
              .from('entity_fields')
              .insert({
                ...field,
                entity_id: entityToEdit.id,
                client_id: collaborator.client_id
              });
            if (fieldError) throw fieldError;
          } else {
            // Campo existente
            const { error: fieldError } = await supabase
              .from('entity_fields')
              .update(field)
              .eq('id', field.id);
            if (fieldError) throw fieldError;
          }
        }

        toast({
          title: "Entidade atualizada",
          description: "A entidade foi atualizada com sucesso."
        });
      } else {
        // Criar nova entidade
        const { data: entity, error: entityError } = await supabase
          .from('custom_entities')
          .insert({
            name: singularName,
            description,
            client_id: collaborator.client_id,
            icon_name: selectedIcon,
            color: selectedColor
          })
          .select()
          .single();

        if (entityError) throw entityError;

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
      }
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving entity:', error);
      toast({
        title: "Erro ao salvar entidade",
        description: "Ocorreu um erro ao salvar a entidade. Tente novamente.",
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
          <DialogTitle>{entityToEdit ? 'Editar Entidade' : 'Nova Entidade'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <EntityBasicInfo
            singularName={singularName}
            pluralName={pluralName}
            description={description}
            onSingularNameChange={(value) => {
              setSingularName(value);
              if (!pluralName) {
                setPluralName(value + 's');
              }
            }}
            onPluralNameChange={setPluralName}
            onDescriptionChange={setDescription}
          />

          <EntityVisualConfig
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onIconChange={setSelectedIcon}
            onColorChange={setSelectedColor}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Campos da Entidade</h3>
            <EntityFieldEditor 
              fields={fields} 
              onChange={setFields} 
              currentEntityId={entityToEdit?.id || singularName}
              entities={entities || []}
            />
            
            {fields.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Campos Configurados</h4>
                <ConfiguredFieldsTable fields={fields} />
              </div>
            )}
          </div>

          <DialogFooter>
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
              {isLoading ? "Salvando..." : entityToEdit ? "Salvar Alterações" : "Criar Entidade"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}