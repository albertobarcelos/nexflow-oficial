import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useGlobalTeamLevels } from "@/hooks/useGlobalTeamLevels";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TeamCurrentLevelSelectorProps {
  teamId: string;
}

export function TeamCurrentLevelSelector({ teamId }: TeamCurrentLevelSelectorProps) {
  const queryClient = useQueryClient();
  const [currentLevelId, setCurrentLevelId] = useState<string>("");
  const [teamClientId, setTeamClientId] = useState<string | null>(null);

  // Buscar nível atual e client_id do time
  const { data: team } = useQuery({
    queryKey: ["team-current-level", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("core_teams")
        .select("current_level_id, client_id")
        .eq("id", teamId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  // Buscar níveis do cliente do time
  const { data: levels = [] } = useGlobalTeamLevels(teamClientId);

  useEffect(() => {
    if (team?.client_id) {
      setTeamClientId(team.client_id);
    }
    if (team?.current_level_id) {
      setCurrentLevelId(team.current_level_id);
    }
  }, [team]);

  useEffect(() => {
    if (team?.current_level_id) {
      setCurrentLevelId(team.current_level_id);
    }
  }, [team]);

  const updateLevel = useMutation({
    mutationFn: async (levelId: string | null) => {
      const { error } = await supabase
        .from("core_teams")
        .update({ current_level_id: levelId })
        .eq("id", teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-current-level", teamId] });
      queryClient.invalidateQueries({ queryKey: ["organization-teams"] });
      toast.success("Nível do time atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar nível do time");
    },
  });

  const handleLevelChange = (levelId: string) => {
    setCurrentLevelId(levelId);
    updateLevel.mutate(levelId);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="current-level">Nível Atual do Time *</Label>
      <Select
        value={currentLevelId}
        onValueChange={handleLevelChange}
        disabled={updateLevel.isPending}
      >
        <SelectTrigger id="current-level">
          <SelectValue placeholder="Selecione o nível atual" />
        </SelectTrigger>
        <SelectContent>
          {levels.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Nenhum nível disponível. Crie níveis na aba "Configuração".
            </div>
          ) : (
            levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name} (Ordem {level.level_order})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        O nível atual determina os percentuais de comissão do time
      </p>
    </div>
  );
}
