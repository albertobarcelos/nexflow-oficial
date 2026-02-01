import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentClientId } from "@/lib/supabase";
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

export function usePublicContactForms() {
  const queryClient = useQueryClient();

  const { data: forms, isLoading, error } = useQuery({
    queryKey: ["public-contact-forms"],
    queryFn: async () => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Cliente não identificado");
      }

      const { data, error } = await (supabase as any)
        .from("public_opportunity_forms")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Garantir compatibilidade com formulários existentes (default: public)
      return (data || []).map((form: any) => ({
        ...form,
        form_type: form.form_type || "public",
        requires_auth: form.requires_auth ?? (form.form_type === "internal"),
      })) as PublicContactForm[];
    },
  });

  const createForm = useMutation({
    mutationFn: async (input: CreateFormInput) => {
      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Cliente não identificado");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Gerar slug único baseado no título
      const baseSlug = input.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      // Adicionar timestamp para garantir unicidade
      const slug = `${baseSlug}-${Date.now()}`;
      
      // Gerar token secreto único
      const token = uuidv4();

      // Determinar tipo de formulário e se requer autenticação
      const formType = input.form_type || "public";
      const requiresAuth = formType === "internal";

      // Validar campos baseado no tipo
      const PUBLIC_FIELD_TYPES = ["text", "email", "tel", "textarea", "number", "checkbox", "cpf_cnpj"];
      const INTERNAL_FIELD_TYPES = [
        ...PUBLIC_FIELD_TYPES,
        "select",
        "user_select",
        "partner_select",
        "company_toggle",
        "contact_type_select",
      ];

      const allowedTypes = formType === "public" ? PUBLIC_FIELD_TYPES : INTERNAL_FIELD_TYPES;
      const invalidFields = input.fields_config.filter((field) => !allowedTypes.includes(field.type));

      if (invalidFields.length > 0) {
        throw new Error(
          `Campos do tipo ${invalidFields.map((f) => f.type).join(", ")} não são permitidos em formulários ${formType === "public" ? "públicos" : "internos"}`
        );
      }

      const { data, error } = await (supabase as any)
        .from("public_opportunity_forms")
        .insert({
          client_id: clientId,
          title: input.title,
          description: input.description,
          slug,
          token,
          fields_config: input.fields_config,
          settings: input.settings || {},
          form_type: formType,
          requires_auth: requiresAuth,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PublicContactForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-contact-forms"] });
      toast.success("Formulário criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar formulário: ${error.message}`);
    },
  });

  const updateForm = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PublicContactForm> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("public_opportunity_forms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PublicContactForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-contact-forms"] });
      toast.success("Formulário atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar formulário: ${error.message}`);
    },
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("public_opportunity_forms")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-contact-forms"] });
      toast.success("Formulário deletado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar formulário: ${error.message}`);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await (supabase as any)
        .from("public_opportunity_forms")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PublicContactForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-contact-forms"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`);
    },
  });

  return {
    forms: forms || [],
    isLoading,
    error,
    createForm,
    updateForm,
    deleteForm,
    toggleActive,
  };
}

