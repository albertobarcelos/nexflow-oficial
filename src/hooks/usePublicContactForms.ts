import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import { useSecureClientQuery } from "@/hooks/useSecureClientQuery";
import {
  useSecureClientMutation,
  invalidateClientQueries,
} from "@/hooks/useSecureClientMutation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export interface PublicContactForm {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  slug: string;
  token: string;
  fields_config: FormFieldConfig[];
  settings: FormSettings;
  is_active: boolean;
  form_type?: "public" | "internal"; // Tipo do formulário
  requires_auth?: boolean; // Se requer autenticação
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FormFieldConfig {
  id: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "number" | "checkbox" | "cpf_cnpj" | "company_toggle" | "partner_select" | "user_select" | "contact_type_select";
  label: string;
  name: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  options?: { label: string; value: string }[]; // Para select
  // Configurações específicas por tipo
  companyToggle?: {
    enabled: boolean;
    allowCreate: boolean;
    required: boolean;
  };
  partnerSelect?: {
    allowCreate: boolean;
  };
  userSelect?: {
    teamId?: string; // Filtrar usuários por time
    teamName?: string; // Nome do time para exibição
  };
  defaultValue?: string | boolean; // Para checkbox e outros campos
}

export interface FormSettings {
  successMessage?: string;
  redirectUrl?: string;
  notifyEmail?: string;
}

export interface CreateFormInput {
  title: string;
  description?: string;
  fields_config: FormFieldConfig[];
  settings?: FormSettings;
  form_type?: "public" | "internal";
}

/** Mapeia linha do banco para PublicContactForm com defaults de form_type/requires_auth */
function mapRowToForm(form: Record<string, unknown>): PublicContactForm {
  return {
    ...form,
    form_type: (form.form_type as string) || "public",
    requires_auth:
      form.requires_auth ?? (form.form_type === "internal"),
  } as PublicContactForm;
}

export function usePublicContactForms() {
  const queryClient = useQueryClient();

  const { data: forms, isLoading, error } = useSecureClientQuery<
    PublicContactForm[]
  >({
    queryKey: ["public-contact-forms"],
    queryFn: async (client, clientId) => {
      const { data, error: queryError } = await client
        .from("public_opportunity_forms")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      const list = (data || []).map(mapRowToForm) as PublicContactForm[];
      return list;
    },
    validateClientIdOnData: true,
  });

  const createForm = useSecureClientMutation<
    PublicContactForm,
    Error,
    CreateFormInput
  >({
    mutationFn: async (client, clientId, input) => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const baseSlug = input.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const slug = `${baseSlug}-${Date.now()}`;
      const token = uuidv4();
      const formType = input.form_type || "public";
      const requiresAuth = formType === "internal";

      const PUBLIC_FIELD_TYPES = [
        "text",
        "email",
        "tel",
        "textarea",
        "number",
        "checkbox",
        "cpf_cnpj",
      ];
      const INTERNAL_FIELD_TYPES = [
        ...PUBLIC_FIELD_TYPES,
        "select",
        "user_select",
        "partner_select",
        "company_toggle",
        "contact_type_select",
      ];
      const allowedTypes =
        formType === "public" ? PUBLIC_FIELD_TYPES : INTERNAL_FIELD_TYPES;
      const invalidFields = input.fields_config.filter(
        (field) => !allowedTypes.includes(field.type)
      );
      if (invalidFields.length > 0) {
        throw new Error(
          `Campos do tipo ${invalidFields.map((f) => f.type).join(", ")} não são permitidos em formulários ${formType === "public" ? "públicos" : "internos"}`
        );
      }

      type FormInsert =
        Database["public"]["Tables"]["public_opportunity_forms"]["Insert"];
      const insertRow: FormInsert = {
        client_id: clientId,
        title: input.title,
        description: input.description ?? null,
        slug,
        token,
        fields_config: input.fields_config as unknown as FormInsert["fields_config"],
        settings: (input.settings || {}) as unknown as FormInsert["settings"],
        form_type: formType,
        requires_auth: requiresAuth,
        created_by: user.id,
      };

      const { data, error: insertError } = await client
        .from("public_opportunity_forms")
        .insert(insertRow)
        .select()
        .single();

      if (insertError) throw insertError;
      return mapRowToForm(data as Record<string, unknown>) as PublicContactForm;
    },
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["public-contact-forms"]);
        toast.success("Formulário criado com sucesso!");
      },
      onError: (err: Error) => {
        toast.error(`Erro ao criar formulário: ${err.message}`);
      },
    },
  });

  const updateForm = useSecureClientMutation<
    PublicContactForm,
    Error,
    Partial<PublicContactForm> & { id: string }
  >({
    mutationFn: async (client, clientId, { id, ...updates }) => {
      type FormUpdate =
        Database["public"]["Tables"]["public_opportunity_forms"]["Update"];
      const { data, error: updateError } = await client
        .from("public_opportunity_forms")
        .update(updates as unknown as FormUpdate)
        .eq("id", id)
        .eq("client_id", clientId)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapRowToForm(data as Record<string, unknown>) as PublicContactForm;
    },
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["public-contact-forms"]);
        toast.success("Formulário atualizado com sucesso!");
      },
      onError: (err: Error) => {
        toast.error(`Erro ao atualizar formulário: ${err.message}`);
      },
    },
  });

  const deleteForm = useSecureClientMutation<void, Error, string>({
    mutationFn: async (client, clientId, id) => {
      const { error: deleteError } = await client
        .from("public_opportunity_forms")
        .delete()
        .eq("id", id)
        .eq("client_id", clientId);

      if (deleteError) throw deleteError;
    },
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["public-contact-forms"]);
        toast.success("Formulário deletado com sucesso!");
      },
      onError: (err: Error) => {
        toast.error(`Erro ao deletar formulário: ${err.message}`);
      },
    },
  });

  const toggleActive = useSecureClientMutation<
    PublicContactForm,
    Error,
    { id: string; is_active: boolean }
  >({
    mutationFn: async (client, clientId, { id, is_active }) => {
      const { data, error: updateError } = await client
        .from("public_opportunity_forms")
        .update({ is_active })
        .eq("id", id)
        .eq("client_id", clientId)
        .select()
        .single();

      if (updateError) throw updateError;
      return mapRowToForm(data as Record<string, unknown>) as PublicContactForm;
    },
    validateClientIdOnResult: true,
    mutationOptions: {
      onSuccess: () => {
        invalidateClientQueries(queryClient, ["public-contact-forms"]);
      },
      onError: (err: Error) => {
        toast.error(`Erro ao alterar status: ${err.message}`);
      },
    },
  });

  return {
    forms: forms ?? [],
    isLoading,
    error,
    createForm,
    updateForm,
    deleteForm,
    toggleActive,
  };
}
