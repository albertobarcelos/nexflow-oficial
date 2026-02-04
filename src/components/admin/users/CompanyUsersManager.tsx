import { useState } from "react";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { OrganizationUser } from "@/hooks/useOrganizationUsers";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import { CreateUserDialog } from "./CreateUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";

interface CompanyUsersManagerProps {
  clientId: string;
  companyName: string;
}

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

export function CompanyUsersManager({ clientId, companyName }: CompanyUsersManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<OrganizationUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<OrganizationUser | null>(null);
  const { data: users = [], isLoading } = useCompanyUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usuários da Empresa</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários de {companyName}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum usuário cadastrado</p>
          <p className="text-sm">Clique em "Novo Usuário" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg">
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
                      <span className="text-sm text-muted-foreground">{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? "default" : "secondary"}
                        className={
                          user.is_active
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900"
                            : "bg-muted text-muted-foreground hover:bg-muted"
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
                          onClick={() => setUserToEdit(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
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
      )}

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setUserToEdit(null);
        }}
        defaultClientId={clientId}
      />

      <CreateUserDialog
        open={!!userToEdit}
        onOpenChange={(open) => {
          if (!open) setUserToEdit(null);
        }}
        user={userToEdit || undefined}
        onSuccess={() => {
          setUserToEdit(null);
        }}
      />

      <DeleteUserDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
        user={userToDelete || undefined}
        onSuccess={() => {
          setUserToDelete(null);
        }}
      />
    </div>
  );
}
