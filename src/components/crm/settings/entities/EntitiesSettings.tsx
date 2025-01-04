import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityDiagram } from "./components/EntityDiagram";
import { EntityList } from "./components/EntityList";
import { CreateEntityDialog } from "./components/CreateEntityDialog";
import { useEntities } from "./hooks/useEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Entity } from "./types";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function EntitiesSettings() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [entityToEdit, setEntityToEdit] = useState<Entity | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);
  const { entities, relationships, isLoading, refetch } = useEntities();
  const { toast } = useToast();

  const handleCreateSuccess = () => {
    refetch();
    toast({
      title: "Entidade criada",
      description: "A entidade foi criada com sucesso.",
    });
  };

  const handleEditSuccess = () => {
    refetch();
    toast({
      title: "Entidade atualizada",
      description: "A entidade foi atualizada com sucesso.",
    });
  };

  const handleEditEntity = (entity: Entity) => {
    setEntityToEdit(entity);
  };

  const handleDeleteEntity = async (entity: Entity) => {
    setEntityToDelete(entity);
  };

  const confirmDelete = async () => {
    if (!entityToDelete) return;

    try {
      // Primeiro deletar os campos da entidade
      const { error: fieldsError } = await supabase
        .from('entity_fields')
        .delete()
        .eq('entity_id', entityToDelete.id);

      if (fieldsError) throw fieldsError;

      // Depois deletar a entidade
      const { error: entityError } = await supabase
        .from('custom_entities')
        .delete()
        .eq('id', entityToDelete.id);

      if (entityError) throw entityError;

      toast({
        title: "Entidade excluída",
        description: "A entidade foi excluída com sucesso.",
      });

      refetch();
    } catch (error) {
      console.error('Erro ao excluir entidade:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir a entidade.",
        variant: "destructive",
      });
    } finally {
      setEntityToDelete(null);
    }
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
        open={isCreateDialogOpen || !!entityToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEntityToEdit(null);
          }
        }}
        onSuccess={entityToEdit ? handleEditSuccess : handleCreateSuccess}
        entityToEdit={entityToEdit}
      />

      <AlertDialog open={!!entityToDelete} onOpenChange={() => setEntityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a entidade "{entityToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}