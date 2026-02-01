import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationUsers } from "@/hooks/useOrganizationUsers";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  teamId,
}: AddTeamMemberDialogProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const { data: users = [] } = useOrganizationUsers();

  // Buscar membros já no time
  const { data: existingMembers = [] } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("core_team_members")
        .select("user_profile_id")
        .eq("team_id", teamId);
      return (data || []).map((m: any) => m.user_profile_id);
    },
    enabled: !!teamId && open,
  });

  // Filtrar usuários que já estão no time
  const availableUsers = users.filter(
    (user) => !existingMembers.includes(user.id)
  );

  const addMember = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) {
        throw new Error("Selecione um usuário");
      }

      // Verificar se time existe
      const { data: team, error: teamError } = await supabase
        .from("core_teams")
        .select("id")
        .eq("id", teamId)
        .single();

      if (teamError || !team) {
        throw new Error("Time não encontrado");
      }

      // Verificar se usuário já está no time
      const { data: existing } = await supabase
        .from("core_team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_profile_id", selectedUserId)
        .maybeSingle();

      if (existing) {
        throw new Error("Usuário já está no time");
      }

      // Adicionar membro (sem client_id, pois a tabela não tem essa coluna)
      const { error } = await supabase.from("core_team_members").insert({
        team_id: teamId,
        user_profile_id: selectedUserId,
        role: selectedRole as any,
        division_percentage: 0, // Inicialmente 0%, pode ser editado depois
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-members-with-levels", teamId] });
      toast.success("Membro adicionado com sucesso!");
      setSelectedUserId("");
      setSelectedRole("member");
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Erro ao adicionar membro:", error);
      toast.error(error?.message || "Erro ao adicionar membro");
    },
  });

  useEffect(() => {
    if (!open) {
      setSelectedUserId("");
      setSelectedRole("member");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro ao Time</DialogTitle>
          <DialogDescription>
            Selecione um usuário e defina seu papel e percentual de divisão de comissão no time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Usuário *</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={addMember.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum usuário disponível
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Papel no Time *</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={addMember.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="ec">EC (Executivo de Contas)</SelectItem>
                <SelectItem value="ev">EV (Especialista de Vendas)</SelectItem>
                <SelectItem value="sdr">SDR (Sales Development Representative)</SelectItem>
                <SelectItem value="ep">EP (Especialista de Produto)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addMember.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => addMember.mutate()}
            disabled={addMember.isPending || !selectedUserId}
          >
            {addMember.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
