import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CollaboratorsTable } from "@/components/collaborator/CollaboratorsTable";
import { AddCollaboratorDialog } from "@/components/collaborator/AddCollaboratorDialog";
import { supabase } from "@/integrations/supabase/client";
import { Collaborator } from "@/types/database";

export default function Collaborators() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: collaborators, isLoading, refetch } = useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select(`
          *,
          clients (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Collaborator & { clients: { name: string; email: string } })[];
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground">
            Gerencie os colaboradores da plataforma
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Colaborador
        </Button>
      </div>

      <CollaboratorsTable collaborators={collaborators || []} />
      
      <AddCollaboratorDialog
        clientId="default-client-id" // You'll need to provide the appropriate client ID
        onSuccess={refetch}
      />
    </div>
  );
}