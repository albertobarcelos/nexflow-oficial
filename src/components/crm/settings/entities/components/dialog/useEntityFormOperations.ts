import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EntityFormState } from "./types";
import { Entity } from "../../types";

export function useEntityFormOperations(entityToEdit: Entity | null) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleEntityUpdate = async (
    entityId: string, 
    clientId: string, 
    formState: EntityFormState
  ) => {
    console.log("Updating existing entity...");
    
    const { error: entityError } = await supabase
      .from('custom_entities')
      .update({
        name: formState.singularName,
        description: formState.description,
        icon_name: formState.selectedIcon,
        color: formState.selectedColor,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId);

    if (entityError) {
      console.error('Entity update error:', entityError);
      throw entityError;
    }

    await handleFieldsUpdate(entityId, clientId, formState.fields);
  };

  const handleEntityCreate = async (clientId: string, formState: EntityFormState) => {
    console.log("Creating new entity...");
    
    const { data: entity, error: entityError } = await supabase
      .from('custom_entities')
      .insert({
        name: formState.singularName,
        description: formState.description,
        client_id: clientId,
        icon_name: formState.selectedIcon,
        color: formState.selectedColor
      })
      .select()
      .single();

    if (entityError) {
      console.error('Entity creation error:', entityError);
      throw entityError;
    }

    if (formState.fields.length > 0 && entity) {
      await handleFieldsCreate(entity.id, clientId, formState.fields);
    }
  };

  const handleFieldsUpdate = async (entityId: string, clientId: string, fields: any[]) => {
    for (const field of fields) {
      if (!field.id || field.id.includes('temp-')) {
        console.log("Inserting new field:", field);
        
        const { error: fieldError } = await supabase
          .from('entity_fields')
          .insert({
            name: field.name,
            field_type: field.field_type,
            description: field.description,
            is_required: field.is_required,
            order_index: field.order_index,
            options: field.options,
            validation_rules: field.validation_rules,
            entity_id: entityId,
            client_id: clientId,
            related_entity_id: field.related_entity_id,
            relationship_type: field.relationship_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (fieldError) {
          console.error('Field insert error:', fieldError);
          throw fieldError;
        }
      } else {
        console.log("Updating existing field:", field);
        
        const { error: fieldError } = await supabase
          .from('entity_fields')
          .update({
            name: field.name,
            field_type: field.field_type,
            description: field.description,
            is_required: field.is_required,
            order_index: field.order_index,
            options: field.options,
            validation_rules: field.validation_rules,
            related_entity_id: field.related_entity_id,
            relationship_type: field.relationship_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', field.id);
        
        if (fieldError) {
          console.error('Field update error:', fieldError);
          throw fieldError;
        }
      }
    }
  };

  const handleFieldsCreate = async (entityId: string, clientId: string, fields: any[]) => {
    console.log("Creating fields for new entity:", fields);
    
    const fieldsToInsert = fields.map((field, index) => ({
      name: field.name,
      field_type: field.field_type,
      description: field.description,
      is_required: field.is_required,
      order_index: index,
      options: field.options,
      validation_rules: field.validation_rules,
      entity_id: entityId,
      client_id: clientId,
      related_entity_id: field.related_entity_id,
      relationship_type: field.relationship_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: fieldsError } = await supabase
      .from('entity_fields')
      .insert(fieldsToInsert);

    if (fieldsError) {
      console.error('Fields creation error:', fieldsError);
      throw fieldsError;
    }
  };

  return {
    isLoading,
    setIsLoading,
    handleEntityUpdate,
    handleEntityCreate
  };
}