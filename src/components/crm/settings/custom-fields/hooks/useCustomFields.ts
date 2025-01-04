import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomField, FieldType } from "../types";

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
            .from('custom_fields')
            .insert({
              ...field,
              client_id: clientId,
              field_type: field.field_type as FieldType,
              pipeline_id: field.pipeline_id,
              stage_id: field.stage_id
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
