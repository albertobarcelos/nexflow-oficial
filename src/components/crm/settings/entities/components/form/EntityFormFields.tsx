import { EntityFieldEditor } from "../field-editor/EntityFieldEditor";
import { Entity, EntityField } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EntityFormFieldsProps {
  currentEntityId: string;
  setFields: (fields: EntityField[]) => void;
  entities: Entity[];
  fields: EntityField[];
}

export function EntityFormFields({ currentEntityId, setFields, entities, fields }: EntityFormFieldsProps) {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch entity fields
  const { data: entityFields, isLoading } = useQuery({
    queryKey: ['entity_fields', currentEntityId],
    enabled: !!currentEntityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_fields')
        .select('*')
        .eq('entity_id', currentEntityId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching entity fields:', error);
        throw error;
      }

      return data as EntityField[];
    }
  });

  const handleFieldsChange = (newFields: EntityField[]) => {
    setFields(newFields);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('entity_fields')
        .upsert(entityFields?.map((field, index) => ({
          ...field,
          order_index: index
        })));

      if (error) throw error;

      toast({
        title: "Campos salvos com sucesso",
        description: "As alterações foram salvas com sucesso.",
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving fields:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-4">
        <h3 className="text-lg font-medium">Campos da Entidade</h3>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </motion.div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="pr-4">
          <EntityFieldEditor 
            fields={entityFields || []}
            onChange={handleFieldsChange}
            currentEntityId={currentEntityId}
            entities={entities || []}
          />
        </div>
      </ScrollArea>
    </div>
  );
}