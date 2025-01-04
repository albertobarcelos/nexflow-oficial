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

export default function EntityView() {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: entityData, isLoading: isLoadingEntity } = useQuery({
    queryKey: ["entity", id],
    queryFn: async () => {
      const { data: entityData, error: entityError } = await supabase
        .from("custom_entities")
        .select("*, entity_fields(*)")
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
    queryKey: ["entity-records", id],
    enabled: !!entityData,
    queryFn: async () => {
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("entity_field_values")
        .select("*")
        .eq("entity_id", id);

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

  const handleCreateRecord = async () => {
    if (!entityData) return;

    try {
      // Criar um novo record_id
      const recordId = crypto.randomUUID();

      // Encontrar campos relacionados
      const relatedFields = entityData.fields.filter(field => field.related_entity_id);

      // Criar registros relacionados primeiro
      for (const field of relatedFields) {
        if (field.related_entity_id) {
          const { data: relatedEntity } = await supabase
            .from('custom_entities')
            .select('*')
            .eq('id', field.related_entity_id)
            .single();

          if (relatedEntity) {
            // Criar um registro relacionado vazio
            const relatedRecordId = crypto.randomUUID();
            await supabase.from('entity_field_values').insert({
              entity_id: field.related_entity_id,
              record_id: relatedRecordId,
              field_id: field.id,
              value: null
            });

            // Criar o relacionamento
            await supabase.from('entity_field_relationships').insert({
              source_field_id: field.id,
              source_record_id: recordId,
              target_record_id: relatedRecordId
            });
          }
        }
      }

      // Criar valores vazios para todos os campos
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

  const isLoading = isLoadingEntity || isLoadingRecords;

  if (isLoading) {
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{entityData.name}</h1>
        <Button onClick={handleCreateRecord} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar {entityData.name}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Buscar ${entityData.name.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {entityData.fields.map((field) => (
                    <TableHead key={field.id}>{field.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords?.map((record, index) => (
                  <TableRow key={index}>
                    {entityData.fields.map((field) => (
                      <TableCell key={field.id}>
                        {record[field.name] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {(!filteredRecords || filteredRecords.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={entityData.fields.length} className="text-center text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}