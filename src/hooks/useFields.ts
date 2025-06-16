import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getCurrentUserData } from "@/lib/auth";
import {
  FieldDefinition,
  FieldValue,
  AddFieldDefinitionInput,
  UpdateFieldDefinitionInput,
} from "@/types/database/fields";

export function useFields(targetType?: FieldDefinition["target_type"]) {
  const [isLoading, setIsLoading] = useState(false);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldValue[]>([]);

  const fetchFieldDefinitions = async () => {
    try {
      setIsLoading(true);

      const collaborator = await getCurrentUserData();

      const query = supabase
        .from("web_field_definitions")
        .select("*")
        .eq("client_id", collaborator.client_id)
        .order("created_at", { ascending: false });

      if (targetType) {
        query.eq("target_type", targetType);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFieldDefinitions(data || []);
    } catch (err) {
      console.error("Erro ao carregar definições de campos:", err);
      toast.error("Erro ao carregar definições de campos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFieldValues = async (targetId: string) => {
    try {
      setIsLoading(true);

      const collaborator = await getCurrentUserData();

      const { data, error } = await supabase
        .from("web_field_values")
        .select("*, field:web_field_definitions(*)")
        .eq("client_id", collaborator.client_id)
        .eq("target_id", targetId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFieldValues(data || []);
    } catch (err) {
      console.error("Erro ao carregar valores dos campos:", err);
      toast.error("Erro ao carregar valores dos campos");
    } finally {
      setIsLoading(false);
    }
  };

  const addFieldDefinition = async (input: AddFieldDefinitionInput) => {
    try {
      setIsLoading(true);

      const collaborator = await getCurrentUserData();

      const { data, error } = await supabase
        .from("web_field_definitions")
        .insert([{ ...input, client_id: collaborator.client_id }])
        .select()
        .single();

      if (error) throw error;

      setFieldDefinitions((prev) => [data, ...prev]);
      toast.success("Campo adicionado com sucesso!");
      return data;
    } catch (err) {
      console.error("Erro ao adicionar campo:", err);
      toast.error("Erro ao adicionar campo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFieldDefinition = async (
    id: string,
    input: UpdateFieldDefinitionInput
  ) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("web_field_definitions")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setFieldDefinitions((prev) =>
        prev.map((field) => (field.id === id ? data : field))
      );
      toast.success("Campo atualizado com sucesso!");
      return data;
    } catch (err) {
      console.error("Erro ao atualizar campo:", err);
      toast.error("Erro ao atualizar campo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFieldDefinition = async (id: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("web_field_definitions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFieldDefinitions((prev) => prev.filter((field) => field.id !== id));
      toast.success("Campo removido com sucesso!");
    } catch (err) {
      console.error("Erro ao remover campo:", err);
      toast.error("Erro ao remover campo");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addFieldValue = async (
    targetId: string,
    fieldId: string,
    value: string
  ) => {
    try {
      setIsLoading(true);

      const collaborator = await getCurrentUserData();

      const { data, error } = await supabase
        .from("web_field_values")
        .insert([
          {
            client_id: collaborator.client_id,
            target_id: targetId,
            field_id: fieldId,
            value,
          },
        ])
        .select("*, field:web_field_definitions(*)")
        .single();

      if (error) throw error;

      setFieldValues((prev) => [data, ...prev]);
      toast.success("Valor adicionado com sucesso!");
      return data;
    } catch (err) {
      console.error("Erro ao adicionar valor:", err);
      toast.error("Erro ao adicionar valor");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFieldValue = async (id: string, value: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("field_values")
        .update({ value })
        .eq("id", id)
        .select("*, field:field_definitions(*)")
        .single();

      if (error) throw error;

      setFieldValues((prev) =>
        prev.map((fieldValue) => (fieldValue.id === id ? data : fieldValue))
      );
      toast.success("Valor atualizado com sucesso!");
      return data;
    } catch (err) {
      console.error("Erro ao atualizar valor:", err);
      toast.error("Erro ao atualizar valor");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFieldValue = async (id: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.from("field_values").delete().eq("id", id);

      if (error) throw error;

      setFieldValues((prev) => prev.filter((fieldValue) => fieldValue.id !== id));
      toast.success("Valor removido com sucesso!");
    } catch (err) {
      console.error("Erro ao remover valor:", err);
      toast.error("Erro ao remover valor");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fieldDefinitions,
    fieldValues,
    fetchFieldDefinitions,
    fetchFieldValues,
    addFieldDefinition,
    updateFieldDefinition,
    deleteFieldDefinition,
    addFieldValue,
    updateFieldValue,
    deleteFieldValue,
  };
} 
