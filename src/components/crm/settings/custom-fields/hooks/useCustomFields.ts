import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomField, EntityField } from "../types";

export function useCustomFields() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [stagedFields, setStagedFields] = useState<Record<string, CustomField[]>>({});
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    const fetchClientId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single();

      if (collaborator) {
        setClientId(collaborator.client_id);
      }
    };

    fetchClientId();
  }, []);

  const handleSave = async () => {
    try {
      if (!clientId) throw new Error('Client ID not found');

      for (const stageId in stagedFields) {
        const fields = stagedFields[stageId];
        for (const field of fields) {
          const { error } = await supabase
            .from('entity_fields')
            .insert({
              client_id: clientId,
              entity_id: field.pipeline_id, // Usando pipeline_id como entity_id temporariamente
              name: field.name,
              field_type: field.field_type,
              description: field.description,
              is_required: field.is_required,
              order_index: field.order_index,
              options: field.options
            });
          
          if (error) throw error;
        }
      }

      toast({
        title: "Alterações salvas",
        description: "Suas alterações foram salvas com sucesso.",
      });
      setHasChanges(false);
      setStagedFields({});
    } catch (error) {
      console.error('Error saving custom fields:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  const handleRevert = () => {
    setStagedFields({});
    toast({
      title: "Alterações revertidas",
      description: "Suas alterações foram desfeitas.",
    });
    setHasChanges(false);
  };

  return {
    hasChanges,
    setHasChanges,
    stagedFields,
    setStagedFields,
    clientId,
    handleSave,
    handleRevert
  };
}