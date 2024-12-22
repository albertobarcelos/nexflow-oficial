import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { Client, mapClientRowToClient, mapClientToClientRow } from "@/types/database";

export function useClientForm(clientData?: Client | null) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: "active",
      plan: "free",
      country: "Brasil",
      ...(clientData || {}),
    },
  });

  const onSubmit = async (formData: ClientFormData) => {
    try {
      const timestamp = new Date().toISOString();
      
      if (clientData?.id) {
        // Update existing client
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
            ...clientData,
            ...formData,
            history: [...(clientData?.history || []), historyEntry],
          });

          const { error } = await supabase
            .from('clients')
            .update(clientRow)
            .eq('id', clientData.id);

          if (error) throw error;

          toast({
            title: "Cliente atualizado",
            description: "Os dados do cliente foram atualizados com sucesso.",
          });
        }
      } else {
        // Create new client
        const historyEntry = {
          timestamp,
          action: 'create',
          changes: {},
        };

        const { error } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            email: formData.email,
            company_name: formData.company_name,
            contact_name: formData.contact_name,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
            notes: formData.notes,
            status: formData.status,
            plan: formData.plan,
            documents: [],
            history: [historyEntry]
          });

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

  return { form, onSubmit };
}