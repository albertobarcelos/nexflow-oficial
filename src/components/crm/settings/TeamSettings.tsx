import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { AddCollaboratorDialog } from "@/components/collaborator/AddCollaboratorDialog";
import { CollaboratorsList } from "@/components/client/license/CollaboratorsList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function TeamSettings() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: collaborator, error } = await supabase
        .from('collaborators')
        .select('*, client:clients(*)')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;
      return collaborator;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Equipe</h2>
          <p className="text-muted-foreground">
            Gerencie sua equipe e permissões
          </p>
        </div>
        {currentUser && (
          <AddCollaboratorDialog
            clientId={currentUser.client_id}
            onSuccess={() => {
              // TODO: Implement refresh logic
            }}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Colaboradores</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser && (
            <CollaboratorsList client_id={currentUser.client_id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
