import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Collaborator } from "@/types/database";

interface CollaboratorsTableProps {
  collaborators: (Collaborator & { clients: { name: string; email: string } })[];
}

export function CollaboratorsTable({ collaborators }: CollaboratorsTableProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'default';
      case 'closer':
        return 'secondary';
      case 'partnership_director':
        return 'destructive';
      case 'partner':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Último Acesso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collaborators.map((collaborator) => (
            <TableRow key={collaborator.id}>
              <TableCell>{collaborator.name}</TableCell>
              <TableCell>{collaborator.email}</TableCell>
              <TableCell>{collaborator.clients.name}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(collaborator.role)}>
                  {collaborator.role}
                </Badge>
              </TableCell>
              <TableCell>
                {collaborator.last_login_at
                  ? formatDate(new Date(collaborator.last_login_at))
                  : "Nunca acessou"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}