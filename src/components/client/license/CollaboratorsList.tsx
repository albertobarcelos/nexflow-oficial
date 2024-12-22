import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CollaboratorsListProps {
  client_id: string;
}

export function CollaboratorsList({ client_id }: CollaboratorsListProps) {
  const { data: collaborators, isLoading } = useQuery({
    queryKey: ['collaborators', client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('client_id', client_id);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-4">Carregando colaboradores...</div>;
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center p-4 border-b">
        <Users className="mr-2 h-4 w-4" />
        <h4 className="font-medium">Colaboradores</h4>
      </div>
      <div className="divide-y">
        {collaborators?.map((collaborator) => (
          <div key={collaborator.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{collaborator.name}</p>
              <p className="text-sm text-muted-foreground">{collaborator.email}</p>
            </div>
            <span className="text-sm bg-muted px-2 py-1 rounded-full">
              {collaborator.role === 'closer' && 'Closer'}
              {collaborator.role === 'partnership_director' && 'Diretor de Parcerias'}
              {collaborator.role === 'partner' && 'Parceiro'}
              {collaborator.role === 'administrator' && 'Administrador'}
            </span>
          </div>
        ))}
        {(!collaborators || collaborators.length === 0) && (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhum colaborador cadastrado
          </p>
        )}
      </div>
    </div>
  );
}