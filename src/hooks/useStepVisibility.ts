import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface StepVisibilityData {
  visibilityType: "company" | "team" | "user" | "user_exclusion";
  teamIds: string[];
  excludedUserIds: string[];
}

// Hook para buscar dados de visibilidade de uma etapa
export function useStepVisibilityData(stepId?: string) {
  return useQuery({
    queryKey: ["nexflow", "step-visibility", stepId],
    enabled: !!stepId,
    queryFn: async (): Promise<StepVisibilityData> => {
      const { data, error } = await supabase.functions.invoke("get-step-visibility", {
        body: { stepId },
      });

      if (error) {
        console.error("Erro ao buscar visibilidade da etapa:", error);
        return { visibilityType: "company", teamIds: [], excludedUserIds: [] };
      }

      // Normalizar tipo para o frontend (user_exclusion -> user)
      const type = data.visibilityType === "user_exclusion" ? "user" : data.visibilityType;

      return {
        visibilityType: type,
        teamIds: data.teamIds || [],
        excludedUserIds: data.excludedUserIds || [],
      };
    },
  });
}

// Hook para atualizar visibilidade de uma etapa
export function useUpdateStepVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      stepId,
      visibilityType,
      teamIds,
      excludedUserIds,
    }: {
      stepId: string;
      visibilityType: "company" | "team" | "user" | "user_exclusion";
      teamIds: string[];
      excludedUserIds: string[];
    }) => {
      if (!stepId) throw new Error("StepId é obrigatório");

      // Mapeamento user -> user_exclusion
      const apiType = visibilityType === "user" ? "user_exclusion" : visibilityType;

      const { data, error } = await supabase.functions.invoke("update-step-visibility", {
        body: {
          stepId,
          visibilityType: apiType,
          teamIds,
          excludedUserIds,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalida a query de visibilidade da etapa
      queryClient.invalidateQueries({
        queryKey: ["nexflow", "step-visibility", variables.stepId],
      });
      // Invalida queries relacionadas à etapa
      queryClient.invalidateQueries({
        queryKey: ["nexflow", "steps", variables.stepId],
      });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar visibilidade da etapa: ${error.message}`);
    },
  });
}






