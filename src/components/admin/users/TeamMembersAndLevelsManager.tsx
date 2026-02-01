import { useState } from "react";
import { useTeamMembersWithLevels, useAssignLevelToMember, useRemoveLevelFromMember } from "@/hooks/useTeamMemberLevels";
import { useTeamLevels } from "@/hooks/useTeamLevels";
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
import { UserPlus, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";

interface TeamMembersAndLevelsManagerProps {
  teamId: string;
  teamName: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamMembersAndLevelsManager({
  teamId,
  teamName,
}: TeamMembersAndLevelsManagerProps) {
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const { data: membersWithLevels = [], isLoading } = useTeamMembersWithLevels(teamId);
  const { data: levels = [] } = useTeamLevels(teamId);
  const assignLevel = useAssignLevelToMember();
  const removeLevel = useRemoveLevelFromMember();

  const handleAssignLevel = async (memberId: string, levelId: string) => {
    try {
      await assignLevel.mutateAsync({
        teamMemberId: memberId,
        levelId,
        teamId,
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleRemoveLevel = async (memberId: string) => {
    try {
      await removeLevel.mutateAsync({
        teamMemberId: memberId,
        teamId,
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

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
          <h3 className="text-lg font-semibold">Membros e Níveis: {teamName}</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie membros do time e atribua níveis hierárquicos
          </p>
        </div>
        <Button onClick={() => setIsAddMemberDialogOpen(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {membersWithLevels.length === 0 ? (
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
                <TableHead>Papel no Time</TableHead>
                <TableHead>Nível Atual</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersWithLevels.map((member) => (
                <TableRow key={member.member_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={null} />
                        <AvatarFallback>
                          {getInitials(member.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.user_email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.role_in_team.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    {member.current_level_name ? (
                      <Badge variant="default">
                        {member.current_level_name} (Ordem {member.current_level_order})
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem nível</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.current_level_name ? (
                      <div className="text-sm">
                        <div>
                          Implantação:{" "}
                          {levels
                            .find((l) => l.id === member.current_level_id)
                            ?.commission_one_time_percentage?.toFixed(2) || "0.00"}
                          %
                        </div>
                        <div>
                          Mensalidade:{" "}
                          {levels
                            .find((l) => l.id === member.current_level_id)
                            ?.commission_recurring_percentage?.toFixed(2) || "0.00"}
                          %
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {member.current_level_id ? (
                        <>
                          <Select
                            value={member.current_level_id}
                            onValueChange={(value) =>
                              handleAssignLevel(member.member_id, value)
                            }
                            disabled={assignLevel.isPending}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {levels.map((level) => (
                                <SelectItem key={level.id} value={level.id}>
                                  {level.name} (Ordem {level.level_order})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLevel(member.member_id)}
                            disabled={removeLevel.isPending}
                            className="h-8 w-8 p-0"
                            title="Remover nível"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Select
                          value=""
                          onValueChange={(value) =>
                            handleAssignLevel(member.member_id, value)
                          }
                          disabled={assignLevel.isPending}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Atribuir nível" />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map((level) => (
                              <SelectItem key={level.id} value={level.id}>
                                {level.name} (Ordem {level.level_order})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
