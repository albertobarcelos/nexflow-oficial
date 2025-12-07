import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationTeams, OrganizationTeam } from "@/hooks/useOrganizationTeams";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Power, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CreateTeamDialog } from "./CreateTeamDialog";
import { TeamMembersDrawer } from "./TeamMembersDrawer";

export function TeamsTab() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<OrganizationTeam | null>(null);
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
  const { data: teams, isLoading, error } = useOrganizationTeams();

  const handleEdit = (teamId: string) => {
    const team = teams?.find((t) => t.id === teamId);
    if (team) {
      setTeamToEdit(team);
    }
  };

  const handleViewMembers = (teamId: string) => {
    setViewingTeamId(teamId);
  };

  const handleToggleStatus = async (team: OrganizationTeam) => {
    try {
      if (!team.client_id) {
        toast.error("Erro: Time não possui cliente vinculado");
        return;
      }

      const requestBody = {
        teamId: team.id,
        clientId: team.client_id,
      };

      const { error } = await supabase.functions.invoke("team-alternate-status", {
        body: requestBody,
      });

      if (error) {
        throw error;
      }

      // Invalidar query para atualizar lista de times
      queryClient.invalidateQueries({ queryKey: ["organization-teams"] });

      toast.success(
        team.is_active
          ? "Time desativado com sucesso!"
          : "Time ativado com sucesso!"
      );
    } catch (error: any) {
      console.error("Erro ao alternar status do time:", error);
      toast.error(
        error?.message || "Erro ao alternar status do time. Tente novamente."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Carregando times...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Erro ao carregar times</p>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Novo Time
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Nenhum time encontrado</p>
        </div>

        <CreateTeamDialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setTeamToEdit(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Time
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Time</TableHead>
              <TableHead>Cliente/Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <span className="font-medium">{team.name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {team.clientName || "Cliente não encontrado"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={team.is_active ? "default" : "secondary"}
                    className={
                      team.is_active
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {team.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMembers(team.id)}
                      className="h-8 w-8 p-0"
                      title="Ver membros do time"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(team.id)}
                      className="h-8 w-8 p-0"
                      title="Editar time"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(team)}
                      className="h-8 w-8 p-0"
                      title={team.is_active ? "Desativar" : "Ativar"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateTeamDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setTeamToEdit(null);
        }}
      />

      <CreateTeamDialog
        open={!!teamToEdit}
        onOpenChange={(open) => {
          if (!open) setTeamToEdit(null);
        }}
        team={teamToEdit || undefined}
        onSuccess={() => {
          setTeamToEdit(null);
        }}
      />

      {viewingTeamId && (
        <TeamMembersDrawer
          open={!!viewingTeamId}
          onOpenChange={(open) => {
            if (!open) setViewingTeamId(null);
          }}
          teamId={viewingTeamId}
          teamName={teams?.find((t) => t.id === viewingTeamId)?.name || ""}
        />
      )}
    </div>
  );
}

