import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Entity, EntityField } from "../../types";

const defaultFields: EntityField[] = [
  {
    id: crypto.randomUUID(),
    name: "CNPJ",
    field_type: "text",
    is_required: true,
    order_index: 0,
    client_id: "",
    entity_id: "",
    validation_rules: {
      pattern: "\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}",
      mask: "99.999.999/9999-99"
    }
  },
  {
    id: crypto.randomUUID(),
    name: "CPF",
    field_type: "text",
    is_required: true,
    order_index: 1,
    client_id: "",
    entity_id: "",
    validation_rules: {
      pattern: "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}",
      mask: "999.999.999-99"
    }
  },
  {
    id: crypto.randomUUID(),
    name: "Celular",
    field_type: "text",
    is_required: true,
    order_index: 2,
    client_id: "",
    entity_id: "",
    validation_rules: {
      pattern: "\\(\\d{2}\\) \\d{5}-\\d{4}",
      mask: "(99) 99999-9999"
    }
  }
];

export function useEntityForm(entityToEdit: Entity | null, onSuccess?: () => void) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [singularName, setSingularName] = useState("");
  const [pluralName, setPluralName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<EntityField[]>([]);
  const [selectedIcon, setSelectedIcon] = useState("database");
  const [selectedColor, setSelectedColor] = useState("#4A90E2");

  useEffect(() => {
    if (entityToEdit) {
      setSingularName(entityToEdit.name);
      setPluralName(entityToEdit.name + 's');
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
      setFields(defaultFields);
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
      console.log("Starting save operation...");
      
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Cliente não encontrado');

      if (entityToEdit) {
        await handleEntityUpdate(entityToEdit.id, collaborator.client_id);
      } else {
        await handleEntityCreate(collaborator.client_id);
      }
      
      console.log("Save operation completed successfully");
      
      toast({
        title: entityToEdit ? "Entidade atualizada" : "Entidade criada",
        description: entityToEdit ? 
          "A entidade foi atualizada com sucesso." : 
          "A entidade foi criada com sucesso."
      });
      
      if (onSuccess) onSuccess();
      
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

  const handleEntityUpdate = async (entityId: string, clientId: string) => {
    console.log("Updating existing entity...");
    
    const { error: entityError } = await supabase
      .from('custom_entities')
      .update({
        name: singularName,
        description,
        icon_name: selectedIcon,
        color: selectedColor,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId);

    if (entityError) {
      console.error('Entity update error:', entityError);
      throw entityError;
    }

    await handleFieldsUpdate(entityId, clientId);
  };

  const handleEntityCreate = async (clientId: string) => {
    console.log("Creating new entity...");
    
    const { data: entity, error: entityError } = await supabase
      .from('custom_entities')
      .insert({
        name: singularName,
        description,
        client_id: clientId,
        icon_name: selectedIcon,
        color: selectedColor
      })
      .select()
      .single();

    if (entityError) {
      console.error('Entity creation error:', entityError);
      throw entityError;
    }

    if (fields.length > 0 && entity) {
      await handleFieldsCreate(entity.id, clientId);
    }
  };

  const handleFieldsUpdate = async (entityId: string, clientId: string) => {
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

  const handleFieldsCreate = async (entityId: string, clientId: string) => {
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
    handleSubmit
  };
}