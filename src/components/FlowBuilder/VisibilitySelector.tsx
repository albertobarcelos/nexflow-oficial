import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useUsers } from "@/hooks/useUsers";
import { getCurrentUserData } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export type VisibilityType = "company" | "team" | "user";

export interface VisibilityConfig {
  visibilityType: VisibilityType;
  visibleTeamIds: string[];
  excludedUserIds: string[];
}

interface VisibilitySelectorProps {
  value: VisibilityConfig;
  onChange: (config: VisibilityConfig) => void;
}

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  const { data: teams = [], isLoading: isLoadingTeams } = useOrganizationTeams();
  const { data: allUsers = [], isLoading: isLoadingUsers } = useUsers();
  const [userClientId, setUserClientId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await getCurrentUserData();
      if (userData?.client_id) {
        setUserClientId(userData.client_id);
      }
    };
    fetchUserData();
  }, []);

  // Filter teams by current user's client
  const availableTeams = teams.filter(
    (team) => (!userClientId || team.client_id === userClientId) && team.is_active
  );

  // Filter users by current user's client
  const availableUsers = allUsers.filter(
    (user) => user.is_active && (!userClientId || user.client_id === userClientId)
  );

  const handleVisibilityTypeChange = (newType: VisibilityType) => {
    onChange({
      visibilityType: newType,
      visibleTeamIds: newType === "company" ? [] : value.visibleTeamIds,
      excludedUserIds: newType === "company" || newType === "team" ? [] : value.excludedUserIds,
    });
  };

  const handleTeamToggle = (teamId: string, checked: boolean) => {
    const newVisibleTeamIds = checked
      ? [...value.visibleTeamIds, teamId]
      : value.visibleTeamIds.filter((id) => id !== teamId);
    
    onChange({
      ...value,
      visibleTeamIds: newVisibleTeamIds,
    });
  };

  const handleUserExclusionToggle = (userId: string, checked: boolean) => {
    const newExcludedUserIds = checked
      ? [...value.excludedUserIds, userId]
      : value.excludedUserIds.filter((id) => id !== userId);
    
    onChange({
      ...value,
      excludedUserIds: newExcludedUserIds,
    });
  };

  const isLoading = isLoadingTeams || isLoadingUsers;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Visibilidade do Flow</p>
        <p className="text-xs text-slate-500">
          Defina quem pode visualizar e interagir com este flow.
        </p>
      </div>

      <RadioGroup
        value={value.visibilityType}
        onValueChange={(val) => handleVisibilityTypeChange(val as VisibilityType)}
        className="space-y-2"
      >
        <div className="flex items-start space-x-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
          <RadioGroupItem value="company" id="visibility-company" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="visibility-company" className="cursor-pointer text-sm font-medium">
              Todos os usuários da empresa
            </Label>
            <p className="text-xs text-slate-500">
              Todos os colaboradores da empresa podem ver este flow.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
          <RadioGroupItem value="team" id="visibility-team" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="visibility-team" className="cursor-pointer text-sm font-medium">
              Por time
            </Label>
            <p className="text-xs text-slate-500">
              Apenas membros dos times selecionados podem ver.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
          <RadioGroupItem value="user" id="visibility-user" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="visibility-user" className="cursor-pointer text-sm font-medium">
              Por usuário (com exclusão)
            </Label>
            <p className="text-xs text-slate-500">
              Selecione times e exclua usuários específicos.
            </p>
          </div>
        </div>
      </RadioGroup>

      {/* Team selection for "team" and "user" visibility types */}
      {(value.visibilityType === "team" || value.visibilityType === "user") && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Selecionar Times
          </Label>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando times...
            </div>
          ) : availableTeams.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum time disponível.</p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {availableTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-white"
                >
                  <Checkbox
                    checked={value.visibleTeamIds.includes(team.id)}
                    onCheckedChange={(checked) =>
                      handleTeamToggle(team.id, checked === true)
                    }
                  />
                  <span>{team.name}</span>
                  <span className="text-xs text-slate-400">
                    ({team.member_count} membros)
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User exclusion for "user" visibility type */}
      {value.visibilityType === "user" && value.visibleTeamIds.length > 0 && (
        <div className="space-y-2 rounded-lg bg-amber-50 p-3">
          <Label className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Excluir Usuários (opcional)
          </Label>
          <p className="text-xs text-amber-600">
            Marque os usuários que NÃO devem ter acesso, mesmo pertencendo aos times selecionados.
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando usuários...
            </div>
          ) : availableUsers.length === 0 ? (
            <p className="text-xs text-amber-600">Nenhum usuário disponível.</p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {availableUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md bg-white p-2 text-sm hover:bg-amber-100"
                >
                  <Checkbox
                    checked={value.excludedUserIds.includes(user.id)}
                    onCheckedChange={(checked) =>
                      handleUserExclusionToggle(user.id, checked === true)
                    }
                  />
                  <span>
                    {user.name} {user.surname}
                  </span>
                  <span className="text-xs text-slate-400">{user.email}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Resumo
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {value.visibilityType === "company" && "Visível para todos da empresa"}
          {value.visibilityType === "team" && (
            <>
              {value.visibleTeamIds.length === 0
                ? "Nenhum time selecionado"
                : `Visível para ${value.visibleTeamIds.length} time(s)`}
            </>
          )}
          {value.visibilityType === "user" && (
            <>
              {value.visibleTeamIds.length === 0
                ? "Nenhum time selecionado"
                : `Visível para ${value.visibleTeamIds.length} time(s)`}
              {value.excludedUserIds.length > 0 &&
                `, excluindo ${value.excludedUserIds.length} usuário(s)`}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

