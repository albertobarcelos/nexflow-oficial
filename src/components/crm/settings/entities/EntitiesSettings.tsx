import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityDiagram } from "./components/EntityDiagram";
import { EntityList } from "./components/EntityList";
import { CreateEntityDialog } from "./components/CreateEntityDialog";
import { useEntities } from "./hooks/useEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Entity } from "./types";

export function EntitiesSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { entities, relationships, isLoading, refetch } = useEntities();
  const { toast } = useToast();

  const handleCreateSuccess = () => {
    refetch();
    toast({
      title: "Entidade criada",
      description: "A entidade foi criada com sucesso.",
    });
  };

  const handleEditEntity = (entity: Entity) => {
    console.log('Edit entity:', entity);
    // Implement edit functionality
  };

  const handleDeleteEntity = (entity: Entity) => {
    console.log('Delete entity:', entity);
    // Implement delete functionality
  };

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

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="diagram">Diagrama</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <EntityList 
            entities={entities}
            onEdit={handleEditEntity}
            onDelete={handleDeleteEntity}
          />
        </TabsContent>
        <TabsContent value="diagram" className="space-y-4">
          <EntityDiagram 
            entities={entities} 
            relationships={relationships}
          />
        </TabsContent>
      </Tabs>

      <CreateEntityDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}