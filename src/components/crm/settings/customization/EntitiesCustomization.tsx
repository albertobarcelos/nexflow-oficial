import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search, Database, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EntityList } from "../entities/components/EntityList";
import { FieldTypesSidebar } from "../custom-fields/FieldTypesSidebar";
import { EntityFormFields } from "../entities/components/form/EntityFormFields";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Entity } from "../entities/types";

export function EntitiesCustomization() {
  const [selectedEntityId, setSelectedEntityId] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: entities, isLoading } = useQuery({
    queryKey: ['custom_entities'],
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      // Atualizando a query para especificar a relação correta
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
    <div className="grid grid-cols-[320px_360px_1fr] gap-6 h-full">
      {/* Lista de Entidades */}
      <Card className="overflow-hidden border-primary/10 shadow-md flex flex-col">
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
      <Card className="overflow-hidden border-primary/10 shadow-md">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                <Database className="w-5 h-5" />
                Tipos de Campo
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[300px]">
                  <p>Arraste e solte os tipos de campo para personalizar sua entidade.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipos de campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>

            <FieldTypesSidebar />
          </div>
        </ScrollArea>
      </Card>

      {/* Área de Configuração */}
      <Card className="overflow-hidden border-primary/10 shadow-md">
        <ScrollArea className="h-full">
          <div className="p-6">
            {selectedEntityId ? (
              <EntityFormFields
                currentEntityId={selectedEntityId}
                fields={[]}
                setFields={() => {}}
                entities={entities || []}
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