import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientSelect } from "./ClientSelect";
import { OrganizationTeam } from "@/hooks/useOrganizationTeams";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: OrganizationTeam;
  defaultClientId?: string; // Client ID padrão ao criar novo time
  companyName?: string; // Nome da empresa (para exibição quando defaultClientId está definido)
  onSuccess?: () => void;
}

interface FormData {
  teamName: string;
  clientId?: string;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  team,
  defaultClientId,
  companyName,
  onSuccess,
}: CreateTeamDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!team;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    teamName: "",
    clientId: defaultClientId || undefined,
  });

  // Carregar dados do time quando em modo de edição
  useEffect(() => {
    if (open && isEditMode && team) {
      loadTeamData();
    } else if (open && !isEditMode) {
      // Limpar formulário quando abrir em modo de criação
      setFormData({
        teamName: "",
        clientId: defaultClientId || undefined,
      });
    }
  }, [open, isEditMode, team, defaultClientId]);

  // Garantir que defaultClientId seja usado quando fornecido
  useEffect(() => {
    if (defaultClientId && !isEditMode && !formData.clientId) {
      setFormData((prev) => ({ ...prev, clientId: defaultClientId }));
    }
  }, [defaultClientId, isEditMode]);

  const loadTeamData = async () => {
    if (!team) return;

    setIsLoadingTeamData(true);
    try {
      // Preencher formulário com dados do time
      setFormData({
        teamName: team.name || "",
        clientId: team.client_id,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do time:", error);
      toast.error("Erro ao carregar dados do time");
    } finally {
      setIsLoadingTeamData(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.teamName.trim()) {
      toast.error("O campo Nome do Time é obrigatório");
      return false;
    }
    // Cliente só é obrigatório em modo de criação
    if (!isEditMode && !formData.clientId && !defaultClientId) {
      toast.error("O campo Cliente/Empresa é obrigatório");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode && team) {
        // Modo de edição - UPDATE direto no Supabase
        const { error } = await (supabase as any)
          .from("core_teams")
          .update({ name: formData.teamName })
          .eq("id", team.id);

        if (error) {
          throw error;
        }

        // Invalidar queries para atualizar lista de times
        queryClient.invalidateQueries({ queryKey: ["organization-teams"] });
        queryClient.invalidateQueries({ queryKey: ["company-teams"] });

        toast.success("Time atualizado com sucesso!");

        // Limpar formulário
        setFormData({
          teamName: "",
          clientId: undefined,
        });

        // Fechar dialog
        onOpenChange(false);
        onSuccess?.();
      } else {
        // Modo de criação - chamar edge function de create
        const requestBody = {
          teamName: formData.teamName,
          clientId: formData.clientId || defaultClientId!,
        };

        const { data, error } = await supabase.functions.invoke("create-team", {
          body: requestBody,
        });

        if (error) {
          throw error;
        }

        // Invalidar queries para atualizar lista de times
        queryClient.invalidateQueries({ queryKey: ["organization-teams"] });
        queryClient.invalidateQueries({ queryKey: ["company-teams"] });

        toast.success("Time criado com sucesso!");

        // Limpar formulário
        setFormData({
          teamName: "",
          clientId: undefined,
        });

        // Fechar dialog
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error(
        `Erro ao ${isEditMode ? "atualizar" : "criar"} time:`,
        error
      );
      toast.error(
        error?.message ||
          `Erro ao ${isEditMode ? "atualizar" : "criar"} time. Tente novamente.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Time" : "Criar Novo Time"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingTeamData && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Carregando dados do time...
            </p>
          </div>
        )}

        {!isLoadingTeamData && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Nome do Time *</Label>
              <Input
                id="teamName"
                type="text"
                value={formData.teamName}
                onChange={(e) => handleInputChange("teamName", e.target.value)}
                placeholder="Digite o nome do time"
                required
                disabled={isLoading}
              />
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="client">Cliente/Empresa *</Label>
                {defaultClientId ? (
                  <Input
                    id="client"
                    type="text"
                    value={companyName || "Empresa selecionada"}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <ClientSelect
                    value={formData.clientId}
                    onChange={(value) => handleInputChange("clientId", value)}
                  />
                )}
              </div>
            )}

            {isEditMode && formData.clientId && (
              <div className="space-y-2">
                <Label htmlFor="client">Cliente/Empresa</Label>
                <Input
                  id="client"
                  type="text"
                  value={team?.clientName || "Cliente atual (não editável)"}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingTeamData}>
                {isLoading
                  ? isEditMode
                    ? "Salvando..."
                    : "Criando..."
                  : isEditMode
                  ? "Salvar Alterações"
                  : "Criar Time"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

