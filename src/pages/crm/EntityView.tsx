import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Plus } from "lucide-react";
import { Entity } from "@/components/crm/settings/entities/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Components
import { EntityViewHeader } from "./components/EntityViewHeader";
import { EntityViewTable } from "./components/EntityViewTable";
import { EntityViewSearch } from "./components/EntityViewSearch";

export default function EntityView() {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: entityData, isLoading: isLoadingEntity } = useQuery({
    queryKey: ["entity", id],
    queryFn: async () => {
      console.log("Fetching entity data for ID:", id);
      const { data: entityData, error: entityError } = await supabase
        .from("custom_entities")
        .select("*, entity_fields(*)")
        .eq("id", id)
        .maybeSingle();

      if (entityError) {
        console.error("Error fetching entity:", entityError);
        throw entityError;
      }
      if (!entityData) {
        console.error("Entity not found");
        throw new Error("Entidade não encontrada");
      }

      console.log("Entity data fetched:", entityData);
      return {
        ...entityData,
        fields: entityData.entity_fields
      } as Entity;
    }
  });

  const { data: records, isLoading: isLoadingRecords } = useQuery({
    queryKey: ["entity-records", id],
    enabled: !!entityData,
    queryFn: async () => {
      console.log("Fetching records for entity:", id);
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("entity_field_values")
        .select("*")
        .eq("entity_id", id);

      if (fieldValuesError) throw fieldValuesError;

      // Group values by record_id
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

      console.log("Records fetched:", Array.from(recordsMap.values()));
      return Array.from(recordsMap.values());
    }
  });

  const handleCreateRecord = async () => {
    if (!entityData) return;

    try {
      const recordId = crypto.randomUUID();
      const relatedFields = entityData.fields.filter(field => field.related_entity_id);

      // Create related records first
      for (const field of relatedFields) {
        if (field.related_entity_id) {
          const { data: relatedEntity } = await supabase
            .from('custom_entities')
            .select('*')
            .eq('id', field.related_entity_id)
            .single();

          if (relatedEntity) {
            const relatedRecordId = crypto.randomUUID();
            await supabase.from('entity_field_values').insert({
              entity_id: field.related_entity_id,
              record_id: relatedRecordId,
              field_id: field.id,
              value: null
            });

            await supabase.from('entity_field_relationships').insert({
              source_field_id: field.id,
              source_record_id: recordId,
              target_record_id: relatedRecordId
            });
          }
        }
      }

      // Create empty values for all fields
      const fieldValues = entityData.fields.map(field => ({
        entity_id: entityData.id,
        field_id: field.id,
        record_id: recordId,
        value: null
      }));

      const { error } = await supabase
        .from('entity_field_values')
        .insert(fieldValues);

      if (error) throw error;

      toast({
        title: "Registro criado",
        description: "Um novo registro foi criado com sucesso."
      });

    } catch (error) {
      console.error('Error creating record:', error);
      toast({
        title: "Erro ao criar registro",
        description: "Ocorreu um erro ao criar o registro.",
        variant: "destructive"
      });
    }
  };

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

  const filteredRecords = records?.filter(record => {
    if (!searchTerm) return true;
    return Object.entries(record).some(([_, value]) => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6">
      <EntityViewHeader 
        entityName={entityData.name}
        onCreateRecord={handleCreateRecord}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <EntityViewSearch
              entityName={entityData.name}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EntityViewTable
            entityData={entityData}
            records={filteredRecords}
          />
        </CardContent>
      </Card>
    </div>
  );
}