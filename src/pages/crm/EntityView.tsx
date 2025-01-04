import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Entity } from "@/components/crm/settings/entities/types";
import { ConfiguredFieldsTable } from "@/components/crm/settings/entities/components/ConfiguredFieldsTable";

export default function EntityView() {
  const { id } = useParams();

  const { data: entity, isLoading } = useQuery({
    queryKey: ["entity", id],
    queryFn: async () => {
      const { data: entityData, error: entityError } = await supabase
        .from("custom_entities")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (entityError) throw entityError;
      if (!entityData) throw new Error("Entidade não encontrada");

      const { data: fields, error: fieldsError } = await supabase
        .from("entity_fields")
        .select("*")
        .eq("entity_id", id)
        .order("order_index");

      if (fieldsError) throw fieldsError;

      return {
        ...entityData,
        fields: fields || []
      } as Entity;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Entidade não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{entity.name}</h1>
        {entity.description && (
          <p className="text-muted-foreground mt-2">{entity.description}</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Campos Configurados</h2>
        <ConfiguredFieldsTable fields={entity.fields} />
      </div>
    </div>
  );
}