import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

export function TeamsTab() {
  const { data: teams, isLoading, error } = useOrganizationTeams();

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
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Nenhum time encontrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome do Time</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Membros</TableHead>
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
                  {team.description || "Sem descrição"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{team.member_count}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

