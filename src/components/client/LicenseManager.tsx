import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { License } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { AddCollaboratorForm } from "./license/AddCollaboratorForm";
import { LicenseHeader } from "./license/LicenseHeader";
import { UserLimitControl } from "./license/UserLimitControl";
import { CollaboratorsList } from "./license/CollaboratorsList";

interface LicenseManagerProps {
  clientId: string;
  currentPlan: "free" | "premium";
  clientName: string;
  clientEmail: string;
}

export function LicenseManager({ clientId, currentPlan, clientName, clientEmail }: LicenseManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [userLimit, setUserLimit] = useState(3);
  const { toast } = useToast();

  const { data: license, refetch: refetchLicense } = useQuery({
    queryKey: ['license', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUserLimit(data.user_limit);
      }
      return data;
    },
  });

  const { data: collaborators, refetch: refetchCollaborators } = useQuery({
    queryKey: ['collaborators', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;
      return data;
    },
  });

  const createLicense = async () => {
    setIsCreating(true);
    try {
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      // First create the license
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          client_id: clientId,
          type: currentPlan,
          expiration_date: expirationDate.toISOString(),
          status: 'active',
          user_limit: userLimit
        })
        .select()
        .single();

      if (licenseError) throw licenseError;

      // Then create the admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: clientEmail,
        password: Math.random().toString(36).slice(-8), // Random password
        options: {
          data: {
            name: clientName,
          },
        },
      });

      if (authError) throw authError;

      // Finally create the collaborator record
      const { error: collaboratorError } = await supabase
        .from('collaborators')
        .insert({
          auth_user_id: authData.user!.id,
          client_id: clientId,
          name: clientName,
          email: clientEmail,
          role: 'administrator',
          permissions: ['*'] // Full permissions
        });

      if (collaboratorError) throw collaboratorError;

      toast({
        title: "Licença criada",
        description: "A licença foi criada com sucesso e o usuário administrador foi configurado.",
      });
      
      refetchLicense();
      refetchCollaborators();
    } catch (error) {
      console.error('Error creating license:', error);
      toast({
        title: "Erro ao criar licença",
        description: "Ocorreu um erro ao criar a licença.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateUserLimit = async (newLimit: number) => {
    if (!license) return;

    try {
      const { error } = await supabase
        .from('licenses')
        .update({ user_limit: newLimit })
        .eq('id', license.id);

      if (error) throw error;

      setUserLimit(newLimit);
      toast({
        title: "Limite atualizado",
        description: "O limite de usuários foi atualizado com sucesso.",
      });
      
      refetchLicense();
    } catch (error) {
      console.error('Error updating user limit:', error);
      toast({
        title: "Erro ao atualizar limite",
        description: "Ocorreu um erro ao atualizar o limite de usuários.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciamento de Licença</h3>
        {!license && (
          <Button
            onClick={createLicense}
            disabled={isCreating}
          >
            {isCreating ? "Criando..." : "Criar Nova Licença"}
          </Button>
        )}
      </div>

      {license && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <LicenseHeader license={license} />
            
            <Dialog open={isAddingCollaborator} onOpenChange={setIsAddingCollaborator}>
              <DialogTrigger asChild>
                <Button disabled={collaborators && collaborators.length >= userLimit}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
                </DialogHeader>
                <AddCollaboratorForm
                  clientId={clientId}
                  onSuccess={() => {
                    setIsAddingCollaborator(false);
                    refetchCollaborators();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <UserLimitControl
            userLimit={userLimit}
            onUpdateLimit={setUserLimit}
            onSave={updateUserLimit}
          />

          <CollaboratorsList collaborators={collaborators || []} />
        </div>
      )}
    </div>
  );
}