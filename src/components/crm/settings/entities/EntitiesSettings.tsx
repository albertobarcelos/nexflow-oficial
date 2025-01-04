import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityDiagram } from "./components/EntityDiagram";
import { EntityList } from "./components/EntityList";
import { CreateEntityDialog } from "./components/CreateEntityDialog";
import { useEntities } from "./hooks/useEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EntitiesSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { entities, relationships, isLoading } = useEntities();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Entidades Personalizadas</h2>
          <p className="text-muted-foreground">
            Gerencie suas entidades e seus relacionamentos
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entidade
        </Button>
      </div>

      <Tabs defaultValue="diagram" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diagram">Diagrama</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="diagram" className="space-y-4">
          <EntityDiagram 
            entities={entities} 
            relationships={relationships}
          />
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <EntityList 
            entities={entities}
          />
        </TabsContent>
      </Tabs>

      <CreateEntityDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}