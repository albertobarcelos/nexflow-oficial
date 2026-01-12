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
}

export function useNexflowFlows() {
  const queryClient = useQueryClient();

  const flowsQuery = useQuery({
    queryKey: ["nexflow", "flows"],
    queryFn: async (): Promise<NexflowFlow[]> => {
      // Usar Edge Function get-flows que aplica filtros de visibilidade
      const { data, error } = await supabase.functions.invoke("get-flows", {
        body: {},
      });

      if (error) {
        console.error("Erro ao carregar flows via Edge Function:", error);
        return [];
      }

      if (!data?.flows || !Array.isArray(data.flows)) {
        return [];
      }

      // Mapear os dados retornados pela Edge Function
      return data.flows.map(mapFlowRow);
    },
    staleTime: 1000 * 30,
    refetchOnMount: true, // Garante refetch ao montar o componente
    refetchOnWindowFocus: false, // #region agent log - Fix: Disable auto refetch, rely on soft reload
    // #endregion
  });

  const createFlowMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      category,
    }: CreateFlowInput): Promise<NexflowFlow> => {
      // Verificar permissão para criar flow
      const { data: permissionsData, error: permissionsError } = await supabase.functions.invoke(
        "check-flow-permissions",
        { body: {} }
      );

      if (permissionsError || !permissionsData?.canCreateFlow) {
        throw new Error(
          "Você não tem permissão para criar flows. Apenas leaders, admins de time e administrators podem criar flows."
        );
      }

      const clientId = await getCurrentClientId();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!clientId || !user) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const payload: {
        name: string;
        category: FlowCategory;
        client_id: string;
        owner_id: string;
        description?: string | null;
      } = {
        name,
        category,
        client_id: clientId,
        owner_id: user.id,
      };

      if (typeof description !== "undefined") {
        payload.description = description;
      }

      const { data, error } = await (nexflowClient() as any)
        .from("flows")
        .insert(payload as any)
        .select()
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar flow.");
      }

      const { error: stepError } = await (nexflowClient() as any)
        .from("steps")
        .insert({
          flow_id: data.id,
          title: "Formulário Inicial",
          color: "#2563eb",
          position: 0,
        } as any);

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
      visibilityType,
    }: UpdateFlowInput) => {
      // Verificar permissão para editar flow
      const { data: permissionsData, error: permissionsError } = await supabase.functions.invoke(
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
      if (typeof isActive !== "undefined")
        payload.is_active = isActive ?? true;
      if (typeof visibilityType !== "undefined")
        payload.visibility_type = visibilityType;

      const { error } = await (nexflowClient() as any)
        .from("flows")
        .update(payload as any)
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
      const { error } = await (nexflowClient() as any)
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/efdc592f-55dd-4e39-a379-f4de78416cde',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useNexflowFlows.ts:useNexflowFlow:queryFn',message:'useNexflowFlow queryFn called',data:{flowId,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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

      // Usar Edge Function para filtrar steps baseado nas permissões do usuário (página Board)
      const { data: stepsResponse, error: stepsError } = await supabase.functions.invoke("get-steps", {
        body: { flowId },
      });

      if (stepsError) {
        throw new Error(`Erro ao carregar etapas: ${stepsError.message}`);
      }

      if (!stepsResponse || !stepsResponse.steps) {
        throw new Error("Resposta inválida da Edge Function get-steps");
      }

      const stepsData = stepsResponse.steps;
      const stepIds = stepsData.map((step) => step.id);
      let fieldsData: StepFieldRow[] = [];

      // Buscar campos apenas das etapas visíveis
      if (stepIds.length > 0) {
        const { data: rawFields, error: fieldsError } = await (client as any)
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
    refetchOnWindowFocus: false, // #region agent log - Fix: Disable auto refetch, rely on soft reload
    // #endregion
  });

  return {
    flow: flowQuery.data?.flow ?? null,
    steps: flowQuery.data?.steps ?? [],
    isLoading: flowQuery.isLoading,
    isError: flowQuery.isError,
    refetch: flowQuery.refetch,
  };
}

