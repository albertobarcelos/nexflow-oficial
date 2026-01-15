import { useEffect, useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrganizationTeams } from "@/hooks/useOrganizationTeams";
import { useUsers } from "@/hooks/useUsers";
import { getCurrentUserData } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
  const [protectedUserIds, setProtectedUserIds] = useState<string[]>([]);
  const [isLoadingProtectedUsers, setIsLoadingProtectedUsers] = useState(false);

  // Garantir que os valores sempre sejam válidos
  const safeValue: VisibilityConfig = {
    visibilityType: value?.visibilityType || "company",
    visibleTeamIds: Array.isArray(value?.visibleTeamIds) ? value.visibleTeamIds : [],
    excludedUserIds: Array.isArray(value?.excludedUserIds) ? value.excludedUserIds : [],
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await getCurrentUserData();
      if (userData?.client_id) {
        setUserClientId(userData.client_id);
      }
    };
    fetchUserData();
  }, []);

  // Buscar usuários protegidos (administrators e admins de time)
  useEffect(() => {
    const fetchProtectedUsers = async () => {
      if (!userClientId) return;

      setIsLoadingProtectedUsers(true);
      try {
        // Buscar administrators
        const { data: administrators } = await supabase
          .from("core_client_users")
          .select("id")
          .eq("client_id", userClientId)
          .eq("role", "administrator")
          .eq("is_active", true);

        const adminIds = administrators?.map((a) => a.id) || [];

        // Buscar admins de time
        const { data: teamAdmins } = await (supabase as any)
          .from("core_team_members")
          .select("user_profile_id")
          .eq("role", "admin");

        const teamAdminIds = teamAdmins?.map((ta: any) => ta.user_profile_id) || [];

        // Combinar IDs protegidos
        const protectedIds = [...new Set([...adminIds, ...teamAdminIds])];
        setProtectedUserIds(protectedIds);
      } catch (error) {
        console.error("Erro ao buscar usuários protegidos:", error);
      } finally {
        setIsLoadingProtectedUsers(false);
      }
    };

    fetchProtectedUsers();
  }, [userClientId]);

  // Filter teams by current user's client
  const availableTeams = teams.filter(
    (team) => (!userClientId || team.client_id === userClientId) && team.is_active
  );

  // Filter users by current user's client
  const allAvailableUsers = allUsers.filter(
    (user) => user.is_active && (!userClientId || user.client_id === userClientId)
  );

  // Filtrar usuários excluíveis (remover administrators e admins de time)
  const availableUsers = useMemo(() => {
    return allAvailableUsers.filter((user) => !protectedUserIds.includes(user.id));
  }, [allAvailableUsers, protectedUserIds]);

  // Remover usuários protegidos da lista de exclusão atual
  useEffect(() => {
    if (
      protectedUserIds.length > 0 &&
      safeValue.excludedUserIds.length > 0
    ) {
      const hasProtectedUsers = safeValue.excludedUserIds.some((id) =>
        protectedUserIds.includes(id)
      );

      if (hasProtectedUsers) {
        const filteredExcluded = safeValue.excludedUserIds.filter(
          (id) => !protectedUserIds.includes(id)
        );
        onChange({
          ...safeValue,
          excludedUserIds: filteredExcluded,
        });
      }
    }
  }, [protectedUserIds, value.excludedUserIds, onChange]);

  const handleVisibilityTypeChange = (newType: VisibilityType) => {
    onChange({
      visibilityType: newType,
      visibleTeamIds: newType === "company" ? [] : safeValue.visibleTeamIds,
      excludedUserIds: newType === "company" || newType === "team" ? [] : safeValue.excludedUserIds,
    });
  };

  const handleTeamToggle = (teamId: string, checked: boolean) => {
    const newVisibleTeamIds = checked
      ? [...safeValue.visibleTeamIds, teamId]
      : safeValue.visibleTeamIds.filter((id) => id !== teamId);
    
    onChange({
      ...safeValue,
      visibleTeamIds: newVisibleTeamIds,
    });
  };

  const handleUserExclusionToggle = (userId: string, checked: boolean) => {
    const newExcludedUserIds = checked
      ? [...safeValue.excludedUserIds, userId]
      : safeValue.excludedUserIds.filter((id) => id !== userId);
    
    onChange({
      ...safeValue,
      excludedUserIds: newExcludedUserIds,
    });
  };

  const isLoading = isLoadingTeams || isLoadingUsers || isLoadingProtectedUsers;

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 p-4">
      <div>
        <p className="text-sm font-semibold text-neutral-900">Visibilidade do Flow</p>
        <p className="text-xs text-neutral-500">
          Defina quem pode visualizar e interagir com este flow.
        </p>
      </div>

      <RadioGroup
        value={safeValue.visibilityType}
        onValueChange={(val) => handleVisibilityTypeChange(val as VisibilityType)}
        className="space-y-2"
      >
        <div
          className="flex items-start space-x-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
          onClick={() => handleVisibilityTypeChange("company")}
        >
          <RadioGroupItem value="company" id="visibility-company" className="mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              Todos os usuários da empresa
            </div>
            <p className="text-xs text-neutral-500">
              Todos os colaboradores da empresa podem ver este flow.
            </p>
          </div>
        </div>

        <div
          className="flex items-start space-x-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
          onClick={() => handleVisibilityTypeChange("team")}
        >
          <RadioGroupItem value="team" id="visibility-team" className="mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              Por time
            </div>
            <p className="text-xs text-neutral-500">
              Apenas membros dos times selecionados podem ver.
            </p>
          </div>
        </div>

        <div
          className="flex items-start space-x-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
          onClick={() => handleVisibilityTypeChange("user")}
        >
          <RadioGroupItem value="user" id="visibility-user" className="mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              Por usuário (com exclusão)
            </div>
            <p className="text-xs text-neutral-500">
              Selecione times e exclua usuários específicos.
            </p>
          </div>
        </div>
      </RadioGroup>

      {/* Team selection for "team" and "user" visibility types */}
      {(safeValue.visibilityType === "team" || safeValue.visibilityType === "user") && (
        <div className="space-y-2 rounded-lg bg-neutral-50 p-3">
          <Label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Selecionar Times
          </Label>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando times...
            </div>
          ) : availableTeams.length === 0 ? (
            <p className="text-xs text-neutral-500">Nenhum time disponível.</p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {availableTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-white"
                >
                  <Checkbox
                    checked={safeValue.visibleTeamIds.includes(team.id)}
                    onCheckedChange={(checked) =>
                      handleTeamToggle(team.id, checked === true)
                    }
                  />
                  <span>{team.name}</span>
                  <span className="text-xs text-neutral-400">
                    ({team.member_count} membros)
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User exclusion for "user" visibility type */}
      {safeValue.visibilityType === "user" && safeValue.visibleTeamIds.length > 0 && (
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
            <p className="text-xs text-amber-600">
              {allAvailableUsers.length === 0
                ? "Nenhum usuário disponível."
                : "Todos os usuários disponíveis são administrators ou admins de time e não podem ser excluídos."}
            </p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {availableUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md bg-white p-2 text-sm hover:bg-amber-100"
                >
                  <Checkbox
                    checked={safeValue.excludedUserIds.includes(user.id)}
                    onCheckedChange={(checked) =>
                      handleUserExclusionToggle(user.id, checked === true)
                    }
                  />
                  <span>
                    {user.name} {user.surname}
                  </span>
                </label>
              ))}
              {allAvailableUsers.length > availableUsers.length && (
                <p className="text-xs text-amber-600 italic pt-2 border-t border-amber-200">
                  {allAvailableUsers.length - availableUsers.length} usuário(s) protegido(s) não podem ser excluídos (administrators e admins de time)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Resumo
        </p>
        <p className="mt-1 text-sm text-neutral-700">
          {safeValue.visibilityType === "company" && "Visível para todos da empresa"}
          {safeValue.visibilityType === "team" && (
            <>
              {safeValue.visibleTeamIds.length === 0
                ? "Nenhum time selecionado"
                : `Visível para ${safeValue.visibleTeamIds.length} time(s)`}
            </>
          )}
          {safeValue.visibilityType === "user" && (
            <>
              {safeValue.visibleTeamIds.length === 0
                ? "Nenhum time selecionado"
                : `Visível para ${safeValue.visibleTeamIds.length} time(s)`}
              {safeValue.excludedUserIds.length > 0 &&
                `, excluindo ${safeValue.excludedUserIds.length} usuário(s)`}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

