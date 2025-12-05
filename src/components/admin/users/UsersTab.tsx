import { useOrganizationUsers } from "@/hooks/useOrganizationUsers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

function getInitials(name: string, surname: string): string {
  const firstInitial = name?.charAt(0).toUpperCase() || "";
  const secondInitial = surname?.charAt(0).toUpperCase() || "";
  return `${firstInitial}${secondInitial}` || "U";
}

function getAvatarUrl(user: {
  avatar_url?: string | null;
  custom_avatar_url?: string | null;
}): string | null {
  return user.custom_avatar_url || user.avatar_url || null;
}

export function UsersTab() {
  const { data: users, isLoading, error } = useOrganizationUsers();

  const handleEdit = (userId: string) => {
    toast.info("Funcionalidade de edição em desenvolvimento");
    console.log("Editar usuário:", userId);
  };

  const handleDelete = (userId: string) => {
    toast.info("Funcionalidade de exclusão em desenvolvimento");
    console.log("Excluir usuário:", userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Erro ao carregar usuários</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Nenhum usuário encontrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const fullName = `${user.name} ${user.surname}`.trim();
            const avatarUrl = getAvatarUrl(user);
            const initials = getInitials(user.name, user.surname);

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {avatarUrl && (
                        <AvatarImage src={avatarUrl} alt={fullName} />
                      )}
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{fullName || "Sem nome"}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{user.role}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.is_active ? "default" : "secondary"}
                    className={
                      user.is_active
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }
                  >
                    {user.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

