import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCurrentClientId,
  nexflowClient,
  supabase,
} from "@/lib/supabase";
import { Database } from "@/types/database";
import {
  FlowCategory,
  NexflowFlow,
  NexflowStep,
  NexflowStepField,
  StepFieldConfiguration,
} from "@/types/nexflow";

type FlowRow = Database["nexflow"]["Tables"]["flows"]["Row"];
type StepRow = Database["nexflow"]["Tables"]["steps"]["Row"];
type StepFieldRow = Database["nexflow"]["Tables"]["step_fields"]["Row"];

export interface NexflowStepWithFields extends NexflowStep {
  fields: NexflowStepField[];
}

export interface NexflowFlowDetails {
  flow: NexflowFlow;
  steps: NexflowStepWithFields[];
}

const mapFlowRow = (row: FlowRow): NexflowFlow => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: (row.category ?? "generic") as FlowCategory,
  isActive: row.is_active ?? true,
  ownerId: row.owner_id,
  clientId: row.client_id,
  createdAt: row.created_at,
});

const mapStepRow = (row: StepRow): NexflowStep => ({
  id: row.id,
  flowId: row.flow_id,
  title: row.title,
  color: row.color ?? "#2563eb",
  position: row.position,
  createdAt: row.created_at,
});

const mapStepFieldRow = (row: StepFieldRow): NexflowStepField => ({
  id: row.id,
  stepId: row.step_id,
  label: row.label,
  fieldType: row.field_type,
  isRequired: Boolean(row.is_required),
  position: row.position ?? 0,
  configuration: (row.configuration as StepFieldConfiguration) ?? {},
  createdAt: row.created_at,
});

interface CreateFlowInput {
  name: string;
  description?: string;
  category: FlowCategory;
}

interface UpdateFlowInput {
  id: string;
  name?: string;
  description?: string | null;
  category?: FlowCategory;
  isActive?: boolean;
}

export function useNexflowFlows() {
  const queryClient = useQueryClient();

  const flowsQuery = useQuery({
    queryKey: ["nexflow", "flows"],
    queryFn: async (): Promise<NexflowFlow[]> => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        return [];
      }

      const { data, error } = await nexflowClient()
        .from("flows")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error || !data) {
        console.error("Erro ao carregar flows do Nexflow:", error);
        return [];
      }

      return data.map(mapFlowRow);
    },
    staleTime: 1000 * 30,
  });

  const createFlowMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      category,
    }: CreateFlowInput): Promise<NexflowFlow> => {
      const clientId = await getCurrentClientId();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!clientId || !user) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const payload: Database["nexflow"]["Tables"]["flows"]["Insert"] = {
        name,
        category,
        client_id: clientId,
        owner_id: user.id,
      };

      if (typeof description !== "undefined") {
        payload.description = description;
      }

      const { data, error } = await nexflowClient()
        .from("flows")
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar flow.");
      }

      const { error: stepError } = await nexflowClient()
        .from("steps")
        .insert({
          flow_id: data.id,
          title: "Formulário Inicial",
          color: "#2563eb",
          position: 0,
        });

      if (stepError) {
        throw stepError;
      }

      return mapFlowRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "flows"] });
      toast.success("Flow criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar flow. Tente novamente.");
    },
  });

  const updateFlowMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      category,
      isActive,
    }: UpdateFlowInput) => {
      const payload: Partial<FlowRow> = {};

      if (typeof name !== "undefined") payload.name = name;
      if (typeof description !== "undefined") payload.description = description;
      if (typeof category !== "undefined") payload.category = category;
      if (typeof isActive !== "undefined")
        payload.is_active = isActive ?? true;

      const { error } = await nexflowClient()
        .from("flows")
        .update(payload)
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "flows"] });
      queryClient.invalidateQueries({
        queryKey: ["nexflow", "flow", variables.id],
      });
      toast.success("Flow atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar flow. Tente novamente.");
    },
  });

  const deleteFlowMutation = useMutation({
    mutationFn: async (flowId: string) => {
      const { error } = await nexflowClient()
        .from("flows")
        .delete()
        .eq("id", flowId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nexflow", "flows"] });
      toast.success("Flow removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover flow. Tente novamente.");
    },
  });

  return {
    flows: flowsQuery.data ?? [],
    isLoading: flowsQuery.isLoading,
    isError: flowsQuery.isError,
    refetch: flowsQuery.refetch,
    createFlow: createFlowMutation.mutateAsync,
    isCreating: createFlowMutation.isPending,
    updateFlow: updateFlowMutation.mutateAsync,
    isUpdating: updateFlowMutation.isPending,
    deleteFlow: deleteFlowMutation.mutateAsync,
    isDeleting: deleteFlowMutation.isPending,
  };
}

export function useNexflowFlow(flowId?: string) {
  const flowQuery = useQuery({
    queryKey: ["nexflow", "flow", flowId],
    enabled: Boolean(flowId),
    queryFn: async (): Promise<NexflowFlowDetails | null> => {
      if (!flowId) {
        return null;
      }

      const clientId = await getCurrentClientId();
      if (!clientId) {
        return null;
      }

      const client = nexflowClient();

      const { data: flowData, error: flowError } = await client
        .from("flows")
        .select("*")
        .eq("id", flowId)
        .eq("client_id", clientId)
        .single();

      if (flowError || !flowData) {
        throw flowError ?? new Error("Flow não encontrado.");
      }

      const { data: stepsData, error: stepsError } = await client
        .from("steps")
        .select("*")
        .eq("flow_id", flowId)
        .order("position", { ascending: true });

      if (stepsError || !stepsData) {
        throw stepsError ?? new Error("Erro ao carregar etapas do flow.");
      }

      const stepIds = stepsData.map((step) => step.id);
      let fieldsData: StepFieldRow[] = [];

      if (stepIds.length > 0) {
        const { data: rawFields, error: fieldsError } = await client
          .from("step_fields")
          .select("*")
          .in("step_id", stepIds)
          .order("position", { ascending: true });

        if (fieldsError) {
          throw fieldsError;
        }

        fieldsData = rawFields ?? [];
      }

      const steps = stepsData.map((step) => {
        const mappedStep = mapStepRow(step);
        const stepFields = fieldsData
          .filter((field) => field.step_id === step.id)
          .map(mapStepFieldRow);

        return {
          ...mappedStep,
          fields: stepFields,
        };
      });

      return {
        flow: mapFlowRow(flowData),
        steps,
      };
    },
    staleTime: 1000 * 10,
  });

  return {
    flow: flowQuery.data?.flow ?? null,
    steps: flowQuery.data?.steps ?? [],
    isLoading: flowQuery.isLoading,
    isError: flowQuery.isError,
    refetch: flowQuery.refetch,
  };
}

