import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nexflowClient } from "@/lib/supabase";
import {
  NexflowStepField,
  StepFieldConfiguration,
  StepFieldType,
} from "@/types/nexflow";
import { isValidUUID } from "@/lib/utils";

// Tipo customizado para a tabela step_fields (migrada do schema nexflow para public)
// TODO: Atualizar o arquivo database.ts com essa tabela após a migração
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

type StepFieldInsert = {
  step_id: string;
  label: string;
  slug?: string | null;
  field_type: string;
  is_required?: boolean;
  position?: number | null;
  configuration?: StepFieldConfiguration | null;
};

interface MutationContext {
  previousFields: NexflowStepField[];
}

const mapFieldRow = (row: StepFieldRow | Record<string, unknown>): NexflowStepField => {
  const field = row as StepFieldRow;
  return {
    id: field.id,
    stepId: field.step_id,
    label: field.label,
    slug: field.slug ?? null,
    fieldType: field.field_type as StepFieldType,
    isRequired: Boolean(field.is_required),
    position: field.position ?? 0,
    configuration: (field.configuration as StepFieldConfiguration) ?? {},
    createdAt: field.created_at,
  };
};

export interface CreateStepFieldInput {
  stepId: string;
  label: string;
  slug?: string | null;
  fieldType: StepFieldType;
  isRequired?: boolean;
  configuration?: StepFieldConfiguration;
  position?: number;
}

export interface UpdateStepFieldInput {
  id: string;
  label?: string;
  slug?: string | null;
  fieldType?: StepFieldType;
  isRequired?: boolean;
  configuration?: StepFieldConfiguration;
  position?: number;
}

export interface ReorderStepFieldsInput {
  items: { id: string; position: number }[];
}

export function useNexflowStepFields(stepId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["nexflow", "step-fields", stepId];

  const fieldsQuery = useQuery({
    queryKey,
    enabled: Boolean(stepId) && isValidUUID(stepId),
    queryFn: async (): Promise<NexflowStepField[]> => {
      if (!stepId || !isValidUUID(stepId)) {
        return [];
      }

      const { data, error } = await (nexflowClient() as any)
        .from("step_fields")
        .select("*")
        .eq("step_id", stepId)
        .order("position", { ascending: true });

      if (error || !data) {
        console.error("Erro ao buscar campos da etapa:", error);
        return [];
      }

      return data.map(mapFieldRow);
    },
  });

  const createFieldMutation = useMutation<
    NexflowStepField,
    Error,
    CreateStepFieldInput
  >({
    mutationFn: async (input: CreateStepFieldInput) => {
      const { stepId: targetStepId } = input;
      if (!targetStepId) {
        throw new Error("Etapa não informada.");
      }

      const payload: StepFieldInsert = {
        step_id: targetStepId,
        label: input.label,
        slug: input.slug ?? null,
        field_type: input.fieldType,
        is_required: input.isRequired ?? false,
        configuration: input.configuration ?? {},
        position:
          input.position ??
          ((fieldsQuery.data?.[fieldsQuery.data.length - 1]?.position ?? 0) +
            1),
      };

      const { data, error } = await (nexflowClient() as any)
        .from("step_fields")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Falha ao criar campo.");
      }

      return mapFieldRow(data);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFields =
        queryClient.getQueryData<NexflowStepField[]>(queryKey) ?? [];

      if (!input.stepId) {
        return { previousFields };
      }

      const optimistField: NexflowStepField = {
        id: `temp-field-${Date.now()}`,
        stepId: input.stepId,
        label: input.label,
        slug: input.slug ?? null,
        fieldType: input.fieldType,
        isRequired: input.isRequired ?? false,
        position:
          input.position ??
          ((previousFields[previousFields.length - 1]?.position ?? 0) + 1),
        configuration: input.configuration ?? {},
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, [...previousFields, optimistField]);
      return { previousFields };
    },
    onError: (error, _variables, context) => {
      if ((context as MutationContext | undefined)?.previousFields) {
        queryClient.setQueryData(queryKey, (context as MutationContext).previousFields);
      }
      toast.error("Erro ao criar campo. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Campo criado com sucesso!");
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async (input: UpdateStepFieldInput) => {
      const payload: Partial<StepFieldRow> = {};
      if (typeof input.label !== "undefined") payload.label = input.label;
      if (typeof input.slug !== "undefined") payload.slug = input.slug;
      if (typeof input.fieldType !== "undefined")
        payload.field_type = input.fieldType;
      if (typeof input.isRequired !== "undefined")
        payload.is_required = input.isRequired;
      if (typeof input.configuration !== "undefined")
        payload.configuration = input.configuration;
      if (typeof input.position !== "undefined")
        payload.position = input.position;

      const { error } = await (nexflowClient() as any)
        .from("step_fields")
        .update(payload)
        .eq("id", input.id);

      if (error) {
        throw error;
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFields =
        queryClient.getQueryData<NexflowStepField[]>(queryKey) ?? [];

      queryClient.setQueryData<NexflowStepField[]>(
        queryKey,
        previousFields.map((field) =>
          field.id === input.id
            ? {
                ...field,
                label:
                  typeof input.label !== "undefined" ? input.label : field.label,
                slug:
                  typeof input.slug !== "undefined" ? input.slug : field.slug,
                fieldType:
                  typeof input.fieldType !== "undefined"
                    ? input.fieldType
                    : field.fieldType,
                isRequired:
                  typeof input.isRequired !== "undefined"
                    ? input.isRequired
                    : field.isRequired,
                configuration:
                  typeof input.configuration !== "undefined"
                    ? (input.configuration as StepFieldConfiguration)
                    : field.configuration,
                position:
                  typeof input.position !== "undefined"
                    ? input.position
                    : field.position,
              }
            : field
        )
      );

      return { previousFields };
    },
    onError: (error, _variables, context) => {
      if ((context as MutationContext | undefined)?.previousFields) {
        queryClient.setQueryData(queryKey, (context as MutationContext).previousFields);
      }
      toast.error("Erro ao atualizar campo. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Campo atualizado com sucesso!");
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const { error } = await (nexflowClient() as any)
        .from("step_fields")
        .delete()
        .eq("id", fieldId);

      if (error) {
        throw error;
      }
    },
    onMutate: async (fieldId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFields =
        queryClient.getQueryData<NexflowStepField[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previousFields.filter((field) => field.id !== fieldId)
      );
      return { previousFields };
    },
    onError: (error, _variables, context) => {
      if ((context as MutationContext | undefined)?.previousFields) {
        queryClient.setQueryData(queryKey, (context as MutationContext).previousFields);
      }
      toast.error("Erro ao remover campo. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Campo removido com sucesso!");
    },
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: async ({ items }: ReorderStepFieldsInput) => {
      await Promise.all(
        items.map(({ id, position }) =>
          (nexflowClient() as any).from("step_fields").update({ position }).eq("id", id)
        )
      );
    },
    onMutate: async ({ items }: ReorderStepFieldsInput) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFields =
        queryClient.getQueryData<NexflowStepField[]>(queryKey) ?? [];
      const updated = previousFields.map((field) => {
        const newPos = items.find((item) => item.id === field.id)?.position;
        return newPos ? { ...field, position: newPos } : field;
      });
      queryClient.setQueryData(queryKey, updated);
      return { previousFields };
    },
    onError: (error, _variables, context) => {
      if ((context as MutationContext | undefined)?.previousFields) {
        queryClient.setQueryData(queryKey, (context as MutationContext).previousFields);
      }
      toast.error("Erro ao reordenar campos. Tente novamente.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    fields: fieldsQuery.data ?? [],
    isLoading: fieldsQuery.isLoading,
    isError: fieldsQuery.isError,
    refetch: fieldsQuery.refetch,
    createField: createFieldMutation.mutateAsync,
    isCreating: createFieldMutation.isPending,
    updateField: updateFieldMutation.mutateAsync,
    isUpdating: updateFieldMutation.isPending,
    deleteField: deleteFieldMutation.mutateAsync,
    isDeleting: deleteFieldMutation.isPending,
    reorderFields: reorderFieldsMutation.mutateAsync,
    isReordering: reorderFieldsMutation.isPending,
  };
}

