import React, { useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import type { ClientDocument } from "@/types/database";

export default function ClientForm() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
      return data ? mapClientRowToClient(data) : null;
    },
    enabled: !!id,
  });

  const { form, onSubmit: originalOnSubmit } = useClientForm(clientData);

  // Wrap the original onSubmit to invalidate queries after successful submission
  const onSubmit = async (values: any) => {
    await originalOnSubmit(values);
    // Invalidate both the single client query and the clients list query
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
    }
    // Navigate back to clients list after successful submission
    navigate('/admin/clients');
  };

  // Reset form when client data changes
  useEffect(() => {
    if (clientData) {
      form.reset({
        name: clientData.name,
        email: clientData.email,
        company_name: clientData.company_name,
        contact_name: clientData.contact_name || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        city: clientData.city || '',
        state: clientData.state || '',
        postal_code: clientData.postal_code || '',
        country: clientData.country || 'Brasil',
        notes: clientData.notes || '',
        status: clientData.status,
        plan: clientData.plan,
      });
    }
  }, [clientData, form]);

  const handleDocumentsUpdate = async (newDocuments: ClientDocument[]) => {
    if (!id || !clientData) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          documents: newDocuments.map(doc => ({
            name: doc.name,
            path: doc.path,
            type: doc.type,
            size: doc.size,
            uploadedAt: doc.uploadedAt
          })),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Invalidate the client query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['client', id] });

      toast({
        title: "Documentos atualizados",
        description: "Os documentos foram atualizados com sucesso.",
      });
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
                <h2 className="text-lg font-semibold">Licenças</h2>
                <LicenseManager
                  clientId={id}
                  currentPlan={clientData?.plan || "free"}
                  clientName={clientData?.name || ""}
                  clientEmail={clientData?.email || ""}
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