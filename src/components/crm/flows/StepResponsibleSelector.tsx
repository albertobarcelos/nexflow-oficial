import { useState } from "react";
import { User, Users, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { useUsers } from "@/hooks/useUsers";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useNexflowSteps } from "@/hooks/useNexflowSteps";
import { cn } from "@/lib/utils";
import type { NexflowStep } from "@/types/nexflow";

interface StepResponsibleSelectorProps {
  step: NexflowStep;
  flowId: string;
}

export function StepResponsibleSelector({
  step,
  flowId,
}: StepResponsibleSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useOrganizationTeams();
  const { updateStep, isUpdating } = useNexflowSteps(flowId);

  const hasResponsible = Boolean(step.responsibleUserId || step.responsibleTeamId);

  const handleSelectUser = async (userId: string | null) => {
    try {
      await updateStep({
        id: step.id,
        responsibleUserId: userId,
        responsibleTeamId: null, // Limpar time ao selecionar usuário
      });
      setOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar responsável:", error);
    }
  };

  const handleSelectTeam = async (teamId: string | null) => {
    try {
      const updatePayload = {
        id: step.id,
        responsibleTeamId: teamId,
        responsibleUserId: null, // Limpar usuário ao selecionar time
      };
      await updateStep(updatePayload);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar responsável:", error);
    }
  };

  const selectedUser = users.find((u) => u.id === step.responsibleUserId);
  const selectedTeam = teams.find((t) => t.id === step.responsibleTeamId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20",
            hasResponsible && "text-white bg-white/20"
          )}
          title="Definir Responsável Automático"
        >
          {hasResponsible ? (
            <Users className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="text-sm font-semibold">Responsável Automático</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Cards movidos para esta etapa serão atribuídos automaticamente
          </p>
        </div>
        <Tabs defaultValue={step.responsibleUserId ? "user" : "team"} className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="user" className="flex-1">
              Usuário
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-1">
              Time
            </TabsTrigger>
          </TabsList>
          <TabsContent value="user" className="p-0 m-0">
            <div className="max-h-[300px] overflow-y-auto">
              <button
                onClick={() => handleSelectUser(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left",
                  !step.responsibleUserId && "bg-muted"
                )}
              >
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <X className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nenhum</p>
                  <p className="text-xs text-muted-foreground">
                    Não atribuir automaticamente
                  </p>
                </div>
                {!step.responsibleUserId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
              {users.map((user) => {
                const isSelected = step.responsibleUserId === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left",
                      isSelected && "bg-muted"
                    )}
                    disabled={isUpdating}
                  >
                    <UserAvatar
                      user={{
                        name: user.name,
                        surname: user.surname,
                        avatar_type: user.avatar_type,
                        avatar_seed: user.avatar_seed,
                        custom_avatar_url: user.custom_avatar_url,
                        avatar_url: user.avatar_url,
                      }}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name} {user.surname}
                      </p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="team" className="p-0 m-0">
            <div className="max-h-[300px] overflow-y-auto">
              <button
                onClick={() => handleSelectTeam(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left",
                  !step.responsibleTeamId && "bg-muted"
                )}
              >
                <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <X className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nenhum</p>
                  <p className="text-xs text-muted-foreground">
                    Não atribuir automaticamente
                  </p>
                </div>
                {!step.responsibleTeamId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
              {teams
                .filter((team) => team.is_active)
                .map((team) => {
                  const isSelected = step.responsibleTeamId === team.id;
                  return (
                    <button
                      key={team.id}
                      onClick={() => handleSelectTeam(team.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left",
                        isSelected && "bg-muted"
                      )}
                      disabled={isUpdating}
                    >
                      <TeamAvatar
                        team={{ id: team.id, name: team.name }}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {team.name}
                        </p>
                        {team.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {team.description}
                          </p>
                        )}
                        {team.member_count !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {team.member_count} membro{team.member_count !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

