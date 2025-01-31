import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CollaboratorsList } from "./license/CollaboratorsList";
import { LicenseHeader } from "./license/LicenseHeader";
import { UserLimitControl } from "./license/UserLimitControl";
import { AddCollaboratorDialog } from "../collaborator/AddCollaboratorDialog";
import type { License } from "@/types/database";

interface LicenseManagerProps {
  clientId: string;
  currentPlan: "free" | "premium";
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
        .maybeSingle();

      if (error) throw error;
      return data as License | null;
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
          user_limit: 3,
          expiration_date: null, // Não usamos mais data de expiração
          status: 'active',
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
      <UserLimitControl 
        userLimit={license.user_limit} 
        onUpdateLimit={() => {}} 
        onSave={() => {}}
      />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Usuários</h3>
          <AddCollaboratorDialog clientId={clientId} onSuccess={() => {}} />
        </div>
        <CollaboratorsList client_id={clientId} />
      </div>
    </div>
  );
}
