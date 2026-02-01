import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OrganizationUser } from "@/hooks/useOrganizationUsers";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: OrganizationUser;
  onSuccess?: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteUserDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-user",
        {
          body: {
            userId: user.id,
          },
        }
      );

      if (error) {
        throw error;
      }

      // Invalidar query para atualizar lista de usuários
      queryClient.invalidateQueries({ queryKey: ["organization-users"] });

      toast.success("Usuário excluído com sucesso!");

      // Fechar dialog
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast.error(
        error?.message || "Erro ao excluir usuário. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fullName = user
    ? `${user.name} ${user.surname}`.trim() || "Usuário"
    : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o usuário{" "}
            <strong>{fullName}</strong> ({user?.email})?
            <br />
            <br />
            Esta ação não pode ser desfeita. O usuário será permanentemente
            removido do sistema, incluindo todas as suas associações com times.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

