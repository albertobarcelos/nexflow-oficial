import { useState } from "react";
import { useOrganizationUsers, OrganizationUser } from "@/hooks/useOrganizationUsers";
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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CreateUserDialog } from "./CreateUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<
    (OrganizationUser & { clientId?: string; teamId?: string }) | null
  >(null);
  const [userToDelete, setUserToDelete] = useState<OrganizationUser | null>(
    null
  );
  const { data: users, isLoading, error } = useOrganizationUsers();

  const handleEdit = async (userId: string) => {
    try {
      const user = users?.find((u) => u.id === userId);
      if (!user) {
        toast.error("Usuário não encontrado");
        return;
      }

      // Buscar clientId do usuário
      const { data: userData, error: userError } = await supabase
        .from("core_client_users")
        .select("client_id")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Erro ao buscar clientId:", userError);
        toast.error("Erro ao carregar dados do usuário");
        return;
      }

      // Buscar teamId do usuário
      const { data: teamData, error: teamError } = await (supabase as any)
        .from("core_team_members")
        .select("team_id")
        .eq("user_profile_id", userId)
        .limit(1)
        .maybeSingle();

      if (teamError) {
        console.error("Erro ao buscar teamId:", teamError);
        // Não é crítico, pode continuar sem teamId
      }

      // Abrir dialog de edição com dados completos
      setUserToEdit({
        ...user,
        clientId: userData?.client_id,
        teamId: teamData?.team_id,
      });
    } catch (error: any) {
      console.error("Erro ao preparar edição:", error);
      toast.error("Erro ao carregar dados do usuário");
    }
  };

  const handleDelete = (userId: string) => {
    const user = users?.find((u) => u.id === userId);
    if (user) {
      setUserToDelete(user);
    }
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Empresa</TableHead>
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
                  <span className="text-sm text-gray-600">
                    {user.company_name || "Sem empresa"}
                  </span>
                </TableCell>
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

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setUserToEdit(null);
        }}
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

