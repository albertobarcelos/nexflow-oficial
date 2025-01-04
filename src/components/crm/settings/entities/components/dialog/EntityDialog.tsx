import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EntityBasicInfo } from "../form/EntityBasicInfo";
import { EntityVisualConfig } from "../form/EntityVisualConfig";
import { EntityFormFields } from "../form/EntityFormFields";
import { EntityFormFooter } from "../form/EntityFormFooter";
import { useEntities } from "../../hooks/useEntities";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CreateEntityDialogProps, EntityField } from "../../types";

export function EntityDialog({ open, onOpenChange, onSuccess, entityToEdit }: CreateEntityDialogProps) {
  const { toast } = useToast();
  const { entities, refetch } = useEntities();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    singularName: "",
    pluralName: "",
    description: "",
    selectedIcon: "database",
    selectedColor: "#4A90E2",
    fields: [] as EntityField[]
  });

  useEffect(() => {
    if (entityToEdit) {
      setFormData({
        singularName: entityToEdit.name,
        pluralName: entityToEdit.name + 's',
        description: entityToEdit.description || "",
        selectedIcon: entityToEdit.icon_name || "database",
        selectedColor: entityToEdit.color || "#4A90E2",
        fields: entityToEdit.fields || []
      });
    } else {
      setFormData({
        singularName: "",
        pluralName: "",
        description: "",
        selectedIcon: "database",
        selectedColor: "#4A90E2",
        fields: []
      });
    }
  }, [entityToEdit, open]);

  const handleSubmit = async () => {
    if (!formData.singularName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome singular da entidade.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting save operation...");
      
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Cliente não encontrado');

      if (entityToEdit) {
        console.log("Updating existing entity...");
        
        // Update entity
        const { error: entityError } = await supabase
          .from('custom_entities')
          .update({
            name: formData.singularName,
            description: formData.description,
            icon_name: formData.selectedIcon,
            color: formData.selectedColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', entityToEdit.id);

        if (entityError) throw entityError;

        // Get existing fields to compare
        const { data: existingFields } = await supabase
          .from('entity_fields')
          .select('*')
          .eq('entity_id', entityToEdit.id);

        // Handle fields
        for (const field of formData.fields) {
          const fieldData = {
            name: field.name,
            field_type: field.field_type,
            description: field.description || null,
            is_required: field.is_required || false,
            order_index: field.order_index || 0,
            options: field.options || [],
            validation_rules: field.validation_rules || {},
            entity_id: entityToEdit.id,
            client_id: collaborator.client_id,
            related_entity_id: field.related_entity_id || null,
            relationship_type: field.relationship_type || null
          };

          const isNewField = !existingFields?.some(ef => ef.id === field.id);
          
          if (isNewField) {
            console.log("Inserting new field:", fieldData);
            const { error: insertError } = await supabase
              .from('entity_fields')
              .insert({
                ...fieldData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Field insert error:', insertError);
              throw insertError;
            }
          } else {
            console.log("Updating existing field:", fieldData);
            const { error: updateError } = await supabase
              .from('entity_fields')
              .update({
                ...fieldData,
                updated_at: new Date().toISOString()
              })
              .eq('id', field.id);

            if (updateError) {
              console.error('Field update error:', updateError);
              throw updateError;
            }
          }
        }

        // Delete removed fields
        if (existingFields) {
          const currentFieldIds = formData.fields.map(f => f.id);
          const fieldsToDelete = existingFields.filter(ef => !currentFieldIds.includes(ef.id));

          if (fieldsToDelete.length > 0) {
            console.log("Deleting fields:", fieldsToDelete.map(f => f.id));
            const { error: deleteError } = await supabase
              .from('entity_fields')
              .delete()
              .in('id', fieldsToDelete.map(f => f.id));

            if (deleteError) throw deleteError;
          }
        }
      } else {
        console.log("Creating new entity...");
        
        const { data: entity, error: entityError } = await supabase
          .from('custom_entities')
          .insert({
            name: formData.singularName,
            description: formData.description,
            client_id: collaborator.client_id,
            icon_name: formData.selectedIcon,
            color: formData.selectedColor
          })
          .select()
          .single();

        if (entityError) throw entityError;

        if (formData.fields.length > 0 && entity) {
          console.log("Creating fields for new entity:", formData.fields);
          
          const fieldsToInsert = formData.fields.map((field, index) => ({
            name: field.name,
            field_type: field.field_type,
            description: field.description || null,
            is_required: field.is_required || false,
            order_index: index,
            options: field.options || [],
            validation_rules: field.validation_rules || {},
            entity_id: entity.id,
            client_id: collaborator.client_id,
            related_entity_id: field.related_entity_id || null,
            relationship_type: field.relationship_type || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: fieldsError } = await supabase
            .from('entity_fields')
            .insert(fieldsToInsert);

          if (fieldsError) throw fieldsError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['entities'] });
      await refetch();
      
      toast({
        title: entityToEdit ? "Entidade atualizada" : "Entidade criada",
        description: entityToEdit ? 
          "A entidade foi atualizada com sucesso." : 
          "A entidade foi criada com sucesso."
      });
      
      if (onSuccess) onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error saving entity:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a entidade. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-full flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{entityToEdit ? 'Editar Entidade' : 'Nova Entidade'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          <div className="pr-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              <EntityBasicInfo
                singularName={formData.singularName}
                pluralName={formData.pluralName}
                description={formData.description}
                onSingularNameChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    singularName: value,
                    pluralName: value ? value + 's' : ''
                  }));
                }}
                onPluralNameChange={(value) => setFormData(prev => ({ ...prev, pluralName: value }))}
                onDescriptionChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              />

              <EntityVisualConfig
                selectedIcon={formData.selectedIcon}
                selectedColor={formData.selectedColor}
                onIconChange={(value) => setFormData(prev => ({ ...prev, selectedIcon: value }))}
                onColorChange={(value) => setFormData(prev => ({ ...prev, selectedColor: value }))}
              />

              <EntityFormFields
                fields={formData.fields}
                setFields={(fields) => setFormData(prev => ({ ...prev, fields }))}
                currentEntityId={entityToEdit?.id || formData.singularName}
                entities={entities || []}
              />
            </form>
          </div>
        </ScrollArea>

        <div className="p-6 border-t mt-auto">
          <EntityFormFooter
            isLoading={isLoading}
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
            entityToEdit={entityToEdit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}