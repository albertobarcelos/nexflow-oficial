import React from 'react';
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { mapClientRowToClient } from "@/types/database";
import { DocumentUpload } from "@/components/client/DocumentUpload";
import { LicenseManager } from "@/components/client/LicenseManager";
import { ClientBasicInfo } from "@/components/client/ClientBasicInfo";
import { ClientAddress } from "@/components/client/ClientAddress";
import { ClientStatus } from "@/components/client/ClientStatus";
import { ClientNotes } from "@/components/client/ClientNotes";
import { ClientFormHeader } from "@/components/client/ClientFormHeader";
import { ClientFormActions } from "@/components/client/ClientFormActions";
import { useClientForm } from "@/hooks/useClientForm";
import type { ClientDocument } from "@/types/database";

export default function ClientForm() {
  const { id } = useParams();
  
  const { data: clientData, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        return mapClientRowToClient(data);
      }
      return null;
    },
    enabled: !!id,
  });

  const { form, onSubmit } = useClientForm(clientData);

  const handleDocumentsUpdate = async (newDocuments: ClientDocument[]) => {
    if (!id || !clientData) return;

    try {
      const clientRow = mapClientToClientRow({
        ...clientData,
        documents: newDocuments,
      });

      const { error } = await supabase
        .from('clients')
        .update(clientRow)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating documents:', error);
      toast({
        title: "Erro ao atualizar documentos",
        description: "Ocorreu um erro ao atualizar os documentos.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <ClientFormHeader id={id} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <ClientBasicInfo form={form} />
          <ClientAddress form={form} />
          <ClientStatus form={form} />
          <ClientNotes form={form} />

          {id && (
            <>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Documentos</h2>
                <DocumentUpload
                  clientId={id}
                  documents={clientData?.documents || []}
                  onDocumentsUpdate={handleDocumentsUpdate}
                />
              </div>

              <div className="space-y-4">
                <LicenseManager
                  clientId={id}
                  currentPlan={clientData?.plan || "free"}
                />
              </div>
            </>
          )}

          <ClientFormActions id={id} isSubmitting={form.formState.isSubmitting} />
        </form>
      </Form>
    </div>
  );
}