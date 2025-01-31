import { Users, Trash2, Check, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getRolePermissions } from "@/lib/utils/roles";
import type { CollaboratorRole } from "@/lib/validations/collaborator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

interface CollaboratorsListProps {
  client_id: string;
}

export function CollaboratorsList({ client_id }: CollaboratorsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: collaborators, isLoading } = useQuery({
    queryKey: ['collaborators', client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select(`
          *,
          collaborator_invites (
            used_at
          )
        `)
        .eq('client_id', client_id);

      if (error) {
        console.error('Error fetching collaborators:', error);
        throw error;
      }

      return data;
    },
    enabled: !!client_id,
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaborators',
          filter: `client_id=eq.${client_id}`
        },
        () => {
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ['collaborators', client_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client_id, queryClient]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['collaborators', client_id] });
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      toast({
        title: "Erro ao remover usuário",
        description: "Ocorreu um erro ao remover o usuário.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (id: string, newRole: CollaboratorRole) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .update({ 
          role: newRole,
          permissions: getRolePermissions(newRole)
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Função atualizada",
        description: "A função do usuário foi atualizada com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ['collaborators', client_id] });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Erro ao atualizar função",
        description: "Ocorreu um erro ao atualizar a função do usuário.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando usuários...</div>;
  }

  return (
    <div className="rounded-md border">
      <div className="flex items-center p-4 border-b">
        <Users className="mr-2 h-4 w-4" />
        <h4 className="font-medium">Usuários</h4>
      </div>
      <div className="divide-y">
        {collaborators?.map((collaborator) => (
          <div key={collaborator.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{collaborator.name}</p>
              <p className="text-sm text-muted-foreground">{collaborator.email}</p>
              <div className="flex items-center mt-1">
                {collaborator.collaborator_invites?.[0]?.used_at ? (
                  <span className="text-xs text-green-600 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Senha configurada
                  </span>
                ) : (
                  <span className="text-xs text-orange-600 flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    Aguardando configuração de senha
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={collaborator.role}
                onValueChange={(value: CollaboratorRole) => handleRoleChange(collaborator.id, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrador</SelectItem>
                  <SelectItem value="closer">Closer</SelectItem>
                  <SelectItem value="partnership_director">Diretor de Parcerias</SelectItem>
                  <SelectItem value="partner">Parceiro</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(collaborator.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
        {(!collaborators || collaborators.length === 0) && (
          <p className="p-4 text-sm text-muted-foreground">
            Nenhum usuário cadastrado
          </p>
        )}
      </div>
    </div>
  );
}
