import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient } from "@/lib/supabase";

/**
 * Mutation para atualizar a empresa (company_id) do card.
 */
export function useUpdateCardCompany(cardId: string, flowId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string | null) => {
      const { error } = await nexflowClient()
        .from("cards")
        .update({ company_id: companyId })
        .eq("id", cardId);

      if (error) throw error;
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards", flowId] });
      queryClient.invalidateQueries({ queryKey: ["nexflow", "cards"] });
      if (companyId) {
        toast.success("Empresa vinculada ao card.");
      } else {
        toast.success("Empresa removida do card.");
      }
    },
    onError: (err: Error) => {
      console.error("Erro ao atualizar empresa do card:", err);
      toast.error(
        err.message ||
          "Erro ao atualizar empresa. Verifique se a coluna company_id existe na tabela cards."
      );
    },
  });
}
