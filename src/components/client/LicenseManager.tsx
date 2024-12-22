import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CollaboratorsList } from "./license/CollaboratorsList";
import { LicenseHeader } from "./license/LicenseHeader";
import { UserLimitControl } from "./license/UserLimitControl";
import { AddCollaboratorDialog } from "../collaborator/AddCollaboratorDialog";

interface LicenseManagerProps {
  clientId: string;
  currentPlan: string;
  clientName: string;
  clientEmail: string;
}

export function LicenseManager({ clientId, currentPlan, clientName, clientEmail }: LicenseManagerProps) {
  const [isCreatingLicense, setIsCreatingLicense] = useState(false);
  const { toast } = useToast();

  const { data: license, isLoading: isLoadingLicense } = useQuery({
    queryKey: ['license', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const createLicense = async () => {
    try {
      setIsCreatingLicense(true);

      // Create license
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          client_id: clientId,
          type: currentPlan,
          expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          user_limit: 3,
        })
        .select()
        .single();

      if (licenseError) throw licenseError;

      // Create admin collaborator
      const { error: collaboratorError } = await supabase
        .from('collaborators')
        .insert({
          client_id: clientId,
          license_id: licenseData.id,
          name: clientName,
          email: clientEmail,
          role: 'administrator',
          auth_user_id: (await supabase.auth.getUser()).data.user?.id,
          permissions: ['admin'],
        });

      if (collaboratorError) throw collaboratorError;

      toast({
        title: "Licença criada",
        description: "A licença foi criada com sucesso.",
      });
    } catch (error) {
      console.error('Error creating license:', error);
      toast({
        title: "Erro ao criar licença",
        description: "Ocorreu um erro ao criar a licença.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLicense(false);
    }
  };

  if (isLoadingLicense) {
    return <div>Carregando...</div>;
  }

  if (!license) {
    return (
      <div className="space-y-4">
        <p>Nenhuma licença encontrada para este cliente.</p>
        <Button onClick={createLicense} disabled={isCreatingLicense}>
          Criar Licença
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LicenseHeader license={license} />
      <UserLimitControl license={license} />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Colaboradores</h3>
          <AddCollaboratorDialog clientId={clientId} onSuccess={() => {}} />
        </div>
        <CollaboratorsList clientId={clientId} />
      </div>
    </div>
  );
}