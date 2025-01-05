import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Entity } from "@/components/crm/settings/entities/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityViewHeader } from "./components/EntityViewHeader";
import { EntityRecordsTable } from "@/components/crm/entities/EntityRecordsTable";
import { useState } from "react";

export default function EntityView() {
  const { id } = useParams();
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data: entityData, isLoading: isLoadingEntity } = useQuery({
    queryKey: ["entity", id],
    queryFn: async () => {
      const { data: entityData, error: entityError } = await supabase
        .from("custom_entities")
        .select(`
          *,
          entity_fields!entity_fields_entity_id_fkey(*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (entityError) throw entityError;
      if (!entityData) throw new Error("Entidade não encontrada");

      return {
        ...entityData,
        fields: entityData.entity_fields
      } as Entity;
    }
  });

  const { data: records, isLoading: isLoadingRecords } = useQuery({
    queryKey: ["entity-records", id, filters],
    enabled: !!entityData,
    queryFn: async () => {
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("entity_field_values")
        .select("*")
        .eq("entity_id", id)
        .ilike("searchable_value", `%${filters.search || ""}%`);

      if (fieldValuesError) throw fieldValuesError;

      // Agrupar valores por record_id
      const recordsMap = new Map();
      fieldValues?.forEach(value => {
        if (!recordsMap.has(value.record_id)) {
          recordsMap.set(value.record_id, {});
        }
        const record = recordsMap.get(value.record_id);
        const field = entityData?.fields.find(f => f.id === value.field_id);
        if (field) {
          record[field.name] = value.value;
        }
      });

      return Array.from(recordsMap.values());
    }
  });

  if (isLoadingEntity || isLoadingRecords) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!entityData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Entidade não encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <EntityViewHeader 
        entityName={entityData.name}
        entityId={entityData.id}
        fields={entityData.fields}
      />

      <Card>
        <CardHeader>
          <CardTitle>{entityData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EntityRecordsTable
            entityName={entityData.name}
            fields={entityData.fields}
            records={records}
            isLoading={isLoadingRecords}
            onFilter={setFilters}
          />
        </CardContent>
      </Card>
    </div>
  );
}