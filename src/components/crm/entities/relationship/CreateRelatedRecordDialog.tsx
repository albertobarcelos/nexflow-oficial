import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityRecordForm } from "../EntityRecordForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateRelatedRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  onSuccess?: (recordId: string) => void;
}

export function CreateRelatedRecordDialog({
  open,
  onOpenChange,
  entityId,
  onSuccess
}: CreateRelatedRecordDialogProps) {
  const { data: entity } = useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => {
      const { data: entity, error } = await supabase
        .from("custom_entities")
        .select(`
          id,
          name,
          entity_fields (*)
        `)
        .eq("id", entityId)
        .single();

      if (error) throw error;
      return entity;
    },
    enabled: open && !!entityId
  });

  if (!entity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo {entity.name}</DialogTitle>
        </DialogHeader>
        
        <EntityRecordForm
          open={open}
          onOpenChange={onOpenChange}
          entityId={entityId}
          entityName={entity.name}
          fields={entity.entity_fields}
          onSuccess={(recordId) => {
            if (onSuccess) onSuccess(recordId);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}