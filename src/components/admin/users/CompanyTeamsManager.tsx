import { useState } from "react";
import { useCompanyTeams } from "@/hooks/useCompanyTeams";
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
import { Pencil, Plus } from "lucide-react";
import { TeamEditDialog } from "./TeamEditDialog";
import { CreateTeamDialog } from "./CreateTeamDialog";

interface CompanyTeamsManagerProps {
  clientId: string;
  companyName: string;
}

export function CompanyTeamsManager({ clientId, companyName }: CompanyTeamsManagerProps) {
  const [teamToEdit, setTeamToEdit] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: teams = [], isLoading } = useCompanyTeams();
  const teamToEditData = teamToEdit
    ? teams.find((t) => t.id === teamToEdit) ?? null
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando times...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Times da Empresa</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os times de {companyName}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Time
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum time cadastrado</p>
          <p className="text-sm">Clique em "Novo Time" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    {team.franchise_name ? (
                      <Badge variant="outline">
                        {team.franchise_code ? `${team.franchise_code} - ` : ""}
                        {team.franchise_name}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem unidade</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{team.member_count || 0} membros</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.is_active ? "default" : "secondary"}>
                      {team.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTeamToEdit(team.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateTeamDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
        }}
        defaultClientId={clientId}
        companyName={companyName}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          // Invalidar queries para atualizar lista
          // O hook useCompanyTeams já será atualizado automaticamente
        }}
      />

      {teamToEdit && (
        <TeamEditDialog
          open={!!teamToEdit}
          onOpenChange={(open) => {
            if (!open) setTeamToEdit(null);
          }}
          team={teamToEditData ? { ...teamToEditData, clientName: companyName } : null}
          onSuccess={() => {
            setTeamToEdit(null);
          }}
        />
      )}
    </div>
  );
}
