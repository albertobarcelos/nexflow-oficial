import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient, supabase } from "@/lib/supabase";
import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";
import {
  invalidateClientQueries,
  useSecureClientMutation,
} from "@/hooks/useSecureClientMutation";
import {
  FlowCategory,
  NexflowFlow,
  NexflowStep,
  NexflowStepField,
  StepFieldConfiguration,
  StepFieldType,
  StepType,
} from "@/types/nexflow";

// Tipos customizados para as tabelas do NexFlow (migradas do schema nexflow para public)
// TODO: Atualizar o arquivo database.ts com essas tabelas após a migração
type FlowRow = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  category: FlowCategory | null;
  is_active: boolean | null;
  owner_id: string | null;
  visibility_type: "company" | "team" | "user" | null;
  created_at: string;
  updated_at: string;
};

type StepRow = {
  id: string;
  flow_id: string;
  title: string;
  color: string | null;
  position: number;
  is_completion_step: boolean | null;
  step_type: StepType | null;
  responsible_user_id: string | null;
  responsible_team_id: string | null;
  created_at: string;
};

type StepFieldRow = {
  id: string;
  step_id: string;
  label: string;
  slug: string | null;
  field_type: string;
  is_required: boolean | null;
  position: number | null;
  configuration: StepFieldConfiguration | null;
  created_at: string;
};

export interface NexflowStepWithFields extends NexflowStep {
  fields: NexflowStepField[];
}

export interface NexflowFlowDetails {
  flow: NexflowFlow;
  steps: NexflowStepWithFields[];
}

const mapFlowRow = (row: FlowRow | Record<string, unknown>): NexflowFlow => {
  const flow = row as FlowRow;
  return {
    id: flow.id,
    name: flow.name,
    description: flow.description,
    category: (flow.category ?? "generic") as FlowCategory,
    isActive: flow.is_active ?? true,
    ownerId: flow.owner_id,
    clientId: flow.client_id,
    createdAt: flow.created_at,
  };
};

const mapStepRow = (row: StepRow): NexflowStep => ({
  id: row.id,
  flowId: row.flow_id,
  title: row.title,
  color: row.color ?? "#2563eb",
  position: row.position,
  createdAt: row.created_at,
  isCompletionStep: Boolean(row.is_completion_step),
  stepType: (row.step_type as StepType) ?? "standard",
  responsibleUserId: row.responsible_user_id ?? null,
  responsibleTeamId: row.responsible_team_id ?? null,
});

const mapStepFieldRow = (row: StepFieldRow | Record<string, unknown>): NexflowStepField => {
  const field = row as StepFieldRow;
  return {
    id: field.id,
    stepId: field.step_id,
    label: field.label,
    fieldType: field.field_type as StepFieldType,
    isRequired: Boolean(field.is_required),
    position: field.position ?? 0,
    configuration: (field.configuration as StepFieldConfiguration) ?? {},
    createdAt: field.created_at,
  };
};

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
  visibilityType?: "company" | "team" | "user";
  /** Quando true, suprime toasts de sucesso/erro (ex.: builder). Não enviado ao backend. */
  _meta?: { skipToasts?: boolean };
}

export function useNexflowFlows() {
  const queryClient = useQueryClient();

  const flowsQuery = useSecureClientQuery<NexflowFlow[]>({
    queryKey: ["nexflow", "flows"],
    queryFn: async (supabaseClient, clientId): Promise<NexflowFlow[]> => {
      // Edge Function get-flows já filtra por client no backend
      const { data, error } = await supabaseClient.functions.invoke("get-flows", {
        body: {},
      });

      if (error) {
        console.error("Erro ao carregar flows via Edge Function:", error);
        return [];
      }

      if (!data?.flows || !Array.isArray(data.flows)) {
        return [];
      }

      // Validação dupla: todos os flows devem pertencer ao cliente atual (dados brutos têm client_id)
      const rawFlows = data.flows as FlowRow[];
      const invalid = rawFlows.filter((f) => f.client_id !== clientId);
      if (invalid.length > 0) {
        console.error("[SECURITY] Flows de outro cliente detectados:", invalid.length);
        throw new Error("Violação de segurança: dados de outro cliente detectados");
      }
      if (typeof console !== "undefined" && console.log) {
        console.log(`[AUDIT] Flows - Client: ${clientId}`);
      }
      return rawFlows.map(mapFlowRow);
    },
    validateClientIdOnData: false,
    queryOptions: {
      staleTime: 1000 * 30,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  });

  const createFlowMutation = useSecureClientMutation<NexflowFlow, Error, CreateFlowInput>({
    mutationFn: async (supabaseClient, clientId, { name, description, category }) => {
      const { data: permissionsData, error: permissionsError } = await supabaseClient.functions.invoke(
        "check-flow-permissions",
        { body: {} }
      );
      if (permissionsError || !permissionsData?.canCreateFlow) {
        throw new Error(
          "Você não tem permissão para criar flows. Apenas leaders, admins de time e administrators podem criar flows."
        );
      }
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("Não foi possível identificar o usuário atual.");
      }
      const payload = {
        name,
        category,
        client_id: clientId,
        owner_id: user.id,
        ...(typeof description !== "undefined" && { description }),
      };
      const client = nexflowClient();
      const { data, error } = await client.from("flows").insert(payload).select().single();
      if (error || !data) {
        throw error ?? new Error("Falha ao criar flow.");
      }
      const { error: stepError } = await client.from("steps").insert({
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
    validateClientIdOnResult: false,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["nexflow", "flows"]);
        toast.success("Flow criado com sucesso!");
      },
      onError: () => {
        toast.error("Erro ao criar flow. Tente novamente.");
      },
    },
  });

  const updateFlowMutation = useSecureClientMutation<void, Error, UpdateFlowInput>({
    mutationFn: async (supabaseClient, _clientId, variables) => {
      const { id, name, description, category, isActive, visibilityType } = variables;
      const { data: permissionsData, error: permissionsError } = await supabaseClient.functions.invoke(
        "check-flow-permissions",
        { body: { flowId: id } }
      );
      if (permissionsError) {
        throw new Error("Erro ao verificar permissões de edição.");
      }
      if (!permissionsData?.canEditFlow) {
        throw new Error(
          "Você não tem permissão para editar este flow. Apenas o dono, leaders, admins de time e administrators podem editar flows."
        );
      }
      const payload: Partial<FlowRow> = {};
      if (typeof name !== "undefined") payload.name = name;
      if (typeof description !== "undefined") payload.description = description;
      if (typeof category !== "undefined") payload.category = category;
      if (typeof isActive !== "undefined") payload.is_active = isActive ?? true;
      if (typeof visibilityType !== "undefined") payload.visibility_type = visibilityType;
      const { error } = await nexflowClient().from("flows").update(payload).eq("id", id);
      if (error) {
        throw error;
      }
    },
    mutationOptions: {
      onSuccess: (_, variables) => {
        invalidateClientQueries(queryClient, ["nexflow", "flows"]);
        queryClient.invalidateQueries({ queryKey: ["nexflow", "flow", variables.id] });
        if (!variables._meta?.skipToasts) {
          toast.success("Flow atualizado com sucesso!");
        }
      },
      onError: (_err, variables) => {
        if (!variables._meta?.skipToasts) {
          toast.error("Erro ao atualizar flow. Tente novamente.");
        }
      },
    },
  });

  const deleteFlowMutation = useSecureClientMutation<void, Error, string>({
    mutationFn: async (supabaseClient, _clientId, flowId) => {
      const { error } = await nexflowClient()
        .from("flows")
        .delete()
        .eq("id", flowId);
      if (error) {
        throw error;
      }
    },
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["nexflow", "flows"]);
        toast.success("Flow removido com sucesso!");
      },
      onError: () => {
        toast.error("Erro ao remover flow. Tente novamente.");
      },
    },
  });

  /** Atualiza flow. Opção skipToasts: true suprime toasts de sucesso e erro (ex.: builder). */
  const updateFlow = (
    variables: Omit<UpdateFlowInput, "_meta">,
    options?: { skipToasts?: boolean }
  ) =>
    updateFlowMutation.mutateAsync({
      ...variables,
      _meta: options?.skipToasts ? { skipToasts: true } : undefined,
    });

  return {
    flows: flowsQuery.data ?? [],
    isLoading: flowsQuery.isLoading,
    isError: flowsQuery.isError,
    refetch: flowsQuery.refetch,
    createFlow: createFlowMutation.mutateAsync,
    isCreating: createFlowMutation.isPending,
    updateFlow,
    isUpdating: updateFlowMutation.isPending,
    deleteFlow: deleteFlowMutation.mutateAsync,
    isDeleting: deleteFlowMutation.isPending,
  };
}

export function useNexflowFlow(flowId?: string) {
  const flowQuery = useSecureClientQuery<NexflowFlowDetails | null>({
    queryKey: ["nexflow", "flow", flowId ?? ""],
    queryFn: async (supabaseClient, clientId): Promise<NexflowFlowDetails | null> => {
      if (!flowId) {
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

      // Validação: flow deve pertencer ao cliente atual
      if ((flowData as unknown as FlowRow).client_id !== clientId) {
        console.error("[SECURITY] Flow de outro cliente acessado:", flowId);
        throw new Error("Flow não pertence ao cliente atual.");
      }
      if (typeof console !== "undefined" && console.log) {
        console.log(`[AUDIT] Flow ${flowId} - Client: ${clientId}`);
      }

      const { data: stepsResponse, error: stepsError } = await supabaseClient.functions.invoke("get-steps", {
        body: { flowId },
      });
      if (stepsError) {
        throw new Error(`Erro ao carregar etapas: ${stepsError.message}`);
      }
      if (!stepsResponse || !stepsResponse.steps) {
        throw new Error("Resposta inválida da Edge Function get-steps");
      }

      const stepsData = stepsResponse.steps;
      const stepIds = stepsData.map((step: { id: string }) => step.id);
      let fieldsData: StepFieldRow[] = [];
      if (stepIds.length > 0) {
        const { data: rawFields, error: fieldsError } = await client
          .from("step_fields")
          .select("*")
          .in("step_id", stepIds)
          .order("position", { ascending: true });
        if (fieldsError) throw fieldsError;
        fieldsData = (rawFields ?? []) as StepFieldRow[];
      }

      const steps = stepsData.map((step: StepRow & { id: string }) => {
        const mappedStep = mapStepRow(step);
        const stepFields = fieldsData
          .filter((field) => field.step_id === step.id)
          .map(mapStepFieldRow);
        return { ...mappedStep, fields: stepFields };
      });

      return { flow: mapFlowRow(flowData), steps };
    },
    queryOptions: {
      enabled: Boolean(flowId),
      staleTime: 1000 * 10,
      refetchOnWindowFocus: false,
    },
  });

  return {
    flow: flowQuery.data?.flow ?? null,
    steps: flowQuery.data?.steps ?? [],
    isLoading: flowQuery.isLoading,
    isError: flowQuery.isError,
    refetch: flowQuery.refetch,
  };
}

