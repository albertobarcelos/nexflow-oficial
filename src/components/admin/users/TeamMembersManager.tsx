import { useState } from "react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UserPlus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";

interface TeamMembersManagerProps {
  teamId: string;
  teamName: string;
}

function getInitials(name: string, surname: string): string {
  const firstInitial = name?.charAt(0).toUpperCase() || "";
  const secondInitial = surname?.charAt(0).toUpperCase() || "";
  return `${firstInitial}${secondInitial}` || "U";
}

export function TeamMembersManager({
  teamId,
  teamName,
}: TeamMembersManagerProps) {
  const queryClient = useQueryClient();
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const { data: members = [], isLoading } = useTeamMembers(teamId);

  const updateMember = useMutation({
    mutationFn: async ({
      memberId,
      role,
      divisionPercentage,
    }: {
      memberId: string;
      role: string;
      divisionPercentage: number;
    }) => {
      const { error } = await supabase
        .from("core_team_members")
        .update({
          role: role as any,
          division_percentage: divisionPercentage,
        })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast.success("Membro atualizado com sucesso!");
      setEditingMemberId(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar membro");
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("core_team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast.success("Membro removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao remover membro");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando membros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Membros do Time: {teamName}</h3>
          <p className="text-sm text-muted-foreground">
            Configure os membros, papéis e percentuais de divisão
          </p>
        </div>
        <Button onClick={() => setIsAddMemberDialogOpen(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum membro no time</p>
          <p className="text-sm">Clique em "Adicionar Membro" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">% Divisão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const fullName = `${member.name} ${member.surname}`.trim();
                const initials = getInitials(member.name, member.surname);
                const isEditing = editingMemberId === member.id;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{fullName || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          defaultValue={member.role || ""}
                          onValueChange={(value) => {
                            // Atualizar papel
                            updateMember.mutate({
                              memberId: member.member_id,
                              role: value,
                              divisionPercentage: member.division_percentage,
                            });
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="leader">Leader</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="ec">EC</SelectItem>
                            <SelectItem value="ev">EV</SelectItem>
                            <SelectItem value="sdr">SDR</SelectItem>
                            <SelectItem value="ep">EP</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{(member.role || "N/A").toUpperCase()}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={member.division_percentage || 0}
                          className="w-24 ml-auto"
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateMember.mutate({
                              memberId: member.member_id,
                              role: member.role || "",
                              divisionPercentage: value,
                            });
                          }}
                        />
                      ) : (
                        <span className="text-sm">
                          {(member.division_percentage || 0).toFixed(2)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingMemberId(
                              isEditing ? null : member.id
                            )
                          }
                          className="h-8 w-8 p-0"
                        >
                          {isEditing ? "✓" : "✎"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember.mutate(member.member_id)}
                          disabled={removeMember.isPending}
                          className="h-8 w-8 p-0 text-destructive"
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

      <AddTeamMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        teamId={teamId}
      />
    </div>
  );
}
