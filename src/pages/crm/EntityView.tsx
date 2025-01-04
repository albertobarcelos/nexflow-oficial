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

export default function EntityView() {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: entityData, isLoading: isLoadingEntity } = useQuery({
    queryKey: ["entity", id],
    queryFn: async () => {
      const { data: entityData, error: entityError } = await supabase
        .from("custom_entities")
        .select("*, entity_fields(*)")
        .eq("id", id)
        .single();

      if (entityError) throw entityError;
      if (!entityData) throw new Error("Entidade não encontrada");

      return entityData as Entity;
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
        <Button className="bg-primary hover:bg-primary/90">
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