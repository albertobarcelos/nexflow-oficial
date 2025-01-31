import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CollaboratorRole = "administrator" | "closer" | "partnership_director" | "partner";

const ROLES: { id: CollaboratorRole; label: string }[] = [
  { id: "administrator", label: "Administrador" },
  { id: "closer", label: "Vendedor" },
  { id: "partnership_director", label: "Diretor de Parcerias" },
  { id: "partner", label: "Parceiro" },
];

type PipelinePermissionsDialogProps = {
  pipeline: {
    id: string;
    name: string;
    allowed_roles?: CollaboratorRole[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PipelinePermissionsDialog({
  pipeline,
  open,
  onOpenChange,
}: PipelinePermissionsDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<CollaboratorRole[]>(
    pipeline.allowed_roles || []
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePermissionsMutation = useMutation({
    mutationFn: async (roles: CollaboratorRole[]) => {
      const { error } = await supabase
        .from('pipeline_configs')
        .update({ allowed_roles: roles })
        .eq('id', pipeline.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_configs'] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do pipeline foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating permissions:', error);
      toast({
        title: "Erro ao atualizar permissões",
        description: "Ocorreu um erro ao atualizar as permissões do pipeline.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "Selecione pelo menos uma função",
        description: "O pipeline precisa ter pelo menos uma função com acesso.",
        variant: "destructive",
      });
      return;
    }
    updatePermissionsMutation.mutate(selectedRoles);
  };

  const toggleRole = (roleId: CollaboratorRole) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permissões do Pipeline: {pipeline.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Selecione quais funções terão acesso a este pipeline:
          </p>
          <div className="space-y-3">
            {ROLES.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={role.id}
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                />
                <Label htmlFor={role.id}>{role.label}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updatePermissionsMutation.isPending}
          >
            {updatePermissionsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
