import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EntityList } from "../entities/components/EntityList";
import { FieldTypesSidebar } from "../custom-fields/FieldTypesSidebar";
import { EntityFormFields } from "../entities/components/form/EntityFormFields";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Entity } from "../entities/types";

export function EntitiesCustomization() {
  const [selectedEntityId, setSelectedEntityId] = useState<string>();
  const [fields, setFields] = useState<any[]>([]);
  
  const { data: entities, isLoading } = useQuery({
    queryKey: ['custom_entities'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data } = await supabase
        .from('custom_entities')
        .select(`
          *,
          entity_fields!entity_fields_entity_id_fkey(*)
        `)
        .eq('client_id', collaborator.client_id)
        .order('created_at', { ascending: true });

      return data as Entity[];
    }
  });

  return (
    <div className="grid grid-cols-[500px_360px_1fr] gap-6 h-full">
      {/* Lista de Entidades */}
      <Card className="overflow-hidden border-primary/10 shadow-md flex flex-col min-w-0">
        <ScrollArea className="flex-1 h-full">
          <div className="p-6">
            <EntityList
              entities={entities || []}
              onEdit={(entity) => setSelectedEntityId(entity.id)}
            />
          </div>
        </ScrollArea>
      </Card>

      {/* Tipos de Campos */}
      <FieldTypesSidebar />

      {/* Área de Configuração */}
      <Card className="overflow-hidden border-primary/10 shadow-md min-w-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            {selectedEntityId ? (
              <EntityFormFields
                currentEntityId={selectedEntityId}
                setFields={setFields}
                entities={entities || []}
                fields={fields}
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 min-h-[400px]"
              >
                <Users className="h-16 w-16 opacity-20" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Selecione uma entidade</p>
                  <p className="text-sm max-w-md">
                    Escolha uma entidade na lista à esquerda ou crie uma nova para começar a personalizar seus campos
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}