import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, List, Network } from "lucide-react";
import { EntityList } from "./components/EntityList";
import { CreateEntityDialog } from "./components/CreateEntityDialog";
import { EntityDiagram } from "./components/EntityDiagram";
import { useEntities } from "./hooks/useEntities";
import { Entity } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EntitiesSettings() {
  const { entities, refetch } = useEntities();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entityToEdit, setEntityToEdit] = useState<Entity | null>(null);

  const handleEdit = (entity: Entity) => {
    console.log("Opening edit dialog for entity:", entity);
    setEntityToEdit(entity);
    setDialogOpen(true);
  };

  const handleDelete = async (entity: Entity) => {
    const confirmed = window.confirm(`Tem certeza que deseja deletar a entidade "${entity.name}"?`);
    if (confirmed) {
      // Implement delete logic here
      console.log("Deleting entity:", entity);
      // Call your delete function and refetch entities
      await refetch();
    }
  };

  const handleSuccess = () => {
    setEntityToEdit(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entidades</h2>
          <p className="text-muted-foreground">
            Gerencie as entidades do seu CRM
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entidade
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="diagram">
            <Network className="h-4 w-4 mr-2" />
            Diagrama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <EntityList
            entities={entities}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="diagram">
          <EntityDiagram
            entities={entities}
            relationships={[]}
          />
        </TabsContent>
      </Tabs>

      <CreateEntityDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEntityToEdit(null);
        }}
        entityToEdit={entityToEdit}
        onSuccess={handleSuccess}
      />
    </div>
  );
}