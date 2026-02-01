import React from "react";
import { useUsers } from "@/hooks/useUsers";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

// Mapeamento de roles para labels em português
const roleLabels: Record<string, string> = {
  administrator: "Administrador",
  closer: "Closer",
  partnership_director: "Diretor de Parcerias",
  partner: "Parceiro",
};

// Função para obter variante do badge baseado no role
const getRoleVariant = (role: string): "default" | "secondary" | "outline" => {
  if (role === "administrator") return "default";
  if (role === "partnership_director") return "secondary";
  return "outline";
};

export const TeamInfoPanel: React.FC = () => {
  const { data: teamMembers, isLoading, error } = useUsers();

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Informações da Equipe</h2>
          <p className="text-sm text-muted-foreground">
            Veja e gerencie os membros da sua equipe aqui.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando membros da equipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Informações da Equipe</h2>
          <p className="text-sm text-muted-foreground">
            Veja e gerencie os membros da sua equipe aqui.
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-sm text-destructive">
            Erro ao carregar membros da equipe. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Informações da Equipe</h2>
          <p className="text-sm text-muted-foreground">
            Veja e gerencie os membros da sua equipe aqui.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum membro da equipe encontrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Informações da Equipe</h2>
        <p className="text-sm text-muted-foreground">
          Veja e gerencie os membros da sua equipe aqui.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Avatar</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cargo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <UserAvatar
                    user={{
                      name: member.name,
                      surname: member.surname,
                      avatar_type: member.avatar_type,
                      avatar_seed: member.avatar_seed,
                      custom_avatar_url: member.custom_avatar_url,
                      avatar_url: member.avatar_url,
                    }}
                    size="md"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {member.name && member.surname
                    ? `${member.name} ${member.surname}`
                    : member.name || member.surname || "Sem nome"}
                </TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleVariant(member.role)}>
                    {roleLabels[member.role] || member.role}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 