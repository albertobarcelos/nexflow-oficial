import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGlobalTeamLevels } from "@/hooks/useGlobalTeamLevels";
import { TeamMembersManager } from "./TeamMembersManager";
import { TeamCurrentLevelSelector } from "./TeamCurrentLevelSelector";
import { OrganizationTeam } from "@/hooks/useOrganizationTeams";

interface TeamEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: OrganizationTeam | null;
  onSuccess?: () => void;
}

interface FormData {
  teamName: string;
}

export function TeamEditDialog({
  open,
  onOpenChange,
  team,
  onSuccess,
}: TeamEditDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    teamName: "",
  });

  useEffect(() => {
    if (open && team) {
      setFormData({
        teamName: team.name || "",
      });
    } else if (open && !team) {
      setFormData({
        teamName: "",
      });
    }
  }, [open, team]);

  const handleSaveName = async () => {
    if (!team) return;

    if (!formData.teamName.trim()) {
      toast.error("O campo Nome do Time é obrigatório");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await (supabase as any)
        .from("core_teams")
        .update({ name: formData.teamName })
        .eq("id", team.id);

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["organization-teams"] });
      toast.success("Nome do time atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar time:", error);
      toast.error(error?.message || "Erro ao atualizar time. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!team) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Time: {team.name}</DialogTitle>
          <DialogDescription>
            Gerencie as informações do time, configure o nível atual e os membros.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Nome do Time *</Label>
                <div className="flex gap-2">
                  <Input
                    id="teamName"
                    type="text"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({ ...formData, teamName: e.target.value })
                    }
                    placeholder="Digite o nome do time"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={isLoading || !formData.teamName.trim()}
                  >
                    {isLoading ? "Salvando..." : "Salvar Nome"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cliente/Empresa</Label>
                <Input
                  type="text"
                  value={team.clientName || "Cliente não encontrado"}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  type="text"
                  value={team.is_active ? "Ativo" : "Inativo"}
                  disabled
                  className="bg-muted"
                />
              </div>

              <TeamCurrentLevelSelector teamId={team.id} />
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <TeamMembersManager
              teamId={team.id}
              teamName={team.name}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
