import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Client, ClientDocument, mapClientRowToClient, mapClientToClientRow } from "@/types/database";
import { DocumentUpload } from "@/components/client/DocumentUpload";
import { LicenseManager } from "@/components/client/LicenseManager";
import { ClientBasicInfo } from "@/components/client/ClientBasicInfo";
import { ClientAddress } from "@/components/client/ClientAddress";
import { ClientStatus } from "@/components/client/ClientStatus";

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: "active",
      plan: "free",
      country: "Brasil",
    },
  });

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
        const client = mapClientRowToClient(data);
        form.reset(client);
        return client;
      }
      return null;
    },
    enabled: !!id,
  });

  const onSubmit = async (formData: ClientFormData) => {
    try {
      const timestamp = new Date().toISOString();
      
      if (id) {
        const changes: Record<string, { old: any; new: any }> = {};
        Object.keys(formData).forEach((key) => {
          if (clientData && formData[key as keyof ClientFormData] !== clientData[key as keyof Client]) {
            changes[key] = {
              old: clientData[key as keyof Client],
              new: formData[key as keyof ClientFormData],
            };
          }
        });

        if (Object.keys(changes).length > 0) {
          const historyEntry = {
            timestamp,
            action: 'update',
            changes,
          };

          const clientRow = mapClientToClientRow({
            ...clientData!,
            ...formData,
            history: [...(clientData?.history || []), historyEntry],
          });

          const { error } = await supabase
            .from('clients')
            .update(clientRow)
            .eq('id', id);

          if (error) throw error;

          toast({
            title: "Cliente atualizado",
            description: "Os dados do cliente foram atualizados com sucesso.",
          });
        }
      } else {
        const historyEntry = {
          timestamp,
          action: 'create',
          changes: {},
        };

        const clientRow = mapClientToClientRow({
          ...formData,
          id: '',
          created_at: timestamp,
          updated_at: timestamp,
          documents: [],
          history: [historyEntry],
        } as Client);

        const { error } = await supabase
          .from('clients')
          .insert(clientRow);

        if (error) throw error;

        toast({
          title: "Cliente criado",
          description: "O cliente foi criado com sucesso.",
        });
      }

      navigate('/admin/clients');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os dados do cliente.",
        variant: "destructive",
      });
    }
  };

  const handleDocumentsUpdate = async (newDocuments: ClientDocument[]) => {
    if (!id) return;

    try {
      const clientRow = mapClientToClientRow({
        ...clientData!,
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
      <div>
        <h1 className="text-3xl font-bold">
          {id ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
        <p className="text-muted-foreground">
          {id ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <ClientBasicInfo form={form} />
          <ClientAddress form={form} />
          <ClientStatus form={form} />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="flex gap-2">
            <Button type="submit">
              {id ? 'Atualizar' : 'Cadastrar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/clients')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}