import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EntityBasicInfo } from "../form/EntityBasicInfo";
import { EntityVisualConfig } from "../form/EntityVisualConfig";
import { EntityFormFields } from "../form/EntityFormFields";
import { EntityFormFooter } from "../form/EntityFormFooter";
import { useEntities } from "../../hooks/useEntities";
import type { CreateEntityDialogProps, EntityField } from "../../types";
import { useEntityFields } from "./useEntityFields";

export function EntityDialog({ open, onOpenChange, onSuccess, entityToEdit }: CreateEntityDialogProps) {
  const { toast } = useToast();
  const { entities } = useEntities();
  const [isLoading, setIsLoading] = useState(false);
  const {
    singularName,
    pluralName,
    description,
    fields,
    selectedIcon,
    selectedColor,
    setSingularName,
    setPluralName,
    setDescription,
    setFields,
    setSelectedIcon,
    setSelectedColor,
    resetForm,
    initializeForm
  } = useEntityFields(entityToEdit);

  useEffect(() => {
    if (entityToEdit) {
      initializeForm(entityToEdit);
    } else {
      resetForm();
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
              .update({
                name: field.name,
                field_type: field.field_type,
                is_required: field.is_required,
                order_index: field.order_index,
                validation_rules: field.validation_rules,
                related_entity_id: field.related_entity_id,
                relationship_type: field.relationship_type
              })
              .eq('id', field.id);
            if (fieldError) throw fieldError;
          }
        }
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
      }
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
      resetForm();
      
      toast({
        title: entityToEdit ? "Entidade atualizada" : "Entidade criada",
        description: entityToEdit ? 
          "A entidade foi atualizada com sucesso." : 
          "A entidade foi criada com sucesso."
      });
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

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-20">
        <DialogHeader>
          <DialogTitle>{entityToEdit ? 'Editar Entidade' : 'Nova Entidade'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
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

          <EntityFormFields
            fields={fields}
            setFields={setFields}
            currentEntityId={entityToEdit?.id || singularName}
            entities={entities || []}
          />

          <EntityFormFooter
            isLoading={isLoading}
            onCancel={handleCancel}
            entityToEdit={entityToEdit}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}