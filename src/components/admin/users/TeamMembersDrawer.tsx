import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamMembersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
  teamName: string;
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

export function TeamMembersDrawer({
  open,
  onOpenChange,
  teamId,
  teamName,
}: TeamMembersDrawerProps) {
  const { data: members, isLoading, error } = useTeamMembers(teamId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Membros do Time: {teamName}</DrawerTitle>
          <DrawerDescription>
            Lista de usuários que fazem parte deste time
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Carregando membros...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">Erro ao carregar membros do time</p>
            </div>
          )}

          {!isLoading && !error && (!members || members.length === 0) && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Nenhum membro encontrado neste time</p>
            </div>
          )}

          {!isLoading && !error && members && members.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const fullName = `${member.name} ${member.surname}`.trim();
                    const avatarUrl = getAvatarUrl(member);
                    const initials = getInitials(member.name, member.surname);

                    return (
                      <TableRow key={member.id}>
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
                            <span className="font-medium">
                              {fullName || "Sem nome"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.is_active ? "default" : "secondary"}
                            className={
                              member.is_active
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {member.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

