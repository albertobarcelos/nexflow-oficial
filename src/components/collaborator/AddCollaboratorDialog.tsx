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
import { supabase } from "@/lib/supabase";
import { AddCollaboratorForm } from "@/components/client/license/AddCollaboratorForm";
import { CollaboratorFormData } from "@/lib/validations/collaborator";
import { getRolePermissions } from "@/lib/utils/roles";
import { v4 as uuidv4 } from 'uuid';

interface AddCollaboratorDialogProps {
  clientId: string;
  onSuccess: () => void;
}

export function AddCollaboratorDialog({ clientId, onSuccess }: AddCollaboratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddCollaborator = async (data: CollaboratorFormData & { license_id: string }) => {
    try {
      // Get the current number of users for this license
      const { data: existingCollaborators, error: countError } = await supabase
        .from('collaborators')
        .select('id')
        .eq('license_id', data.license_id);

      if (countError) throw countError;

      // Get the license to check user limit
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .select('user_limit')
        .eq('id', data.license_id)
        .single();

      if (licenseError) throw licenseError;

      if (existingCollaborators.length >= license.user_limit) {
        toast({
          title: "Limite excedido",
          description: `Esta licença permite apenas ${license.user_limit} usuários.`,
          variant: "destructive",
        });
        return;
      }

      const pendingAuthId = uuidv4();

      // Create user with role-based permissions
      const { data: newCollaborator, error: collaboratorError } = await supabase
        .from('collaborators')
        .insert({
          client_id: clientId,
          license_id: data.license_id,
          name: data.name,
          email: data.email,
          role: data.role,
          permissions: getRolePermissions(data.role),
          auth_user_id: pendingAuthId,
        })
        .select()
        .single();

      if (collaboratorError) throw collaboratorError;

      // Send invitation email
      const { error: inviteError } = await supabase.functions.invoke('send-invite', {
        body: {
          collaboratorId: newCollaborator.id,
          name: data.name,
          email: data.email,
          inviteUrl: `${window.location.origin}/collaborator/set-password`,
        },
      });

      if (inviteError) throw inviteError;

      toast({
        title: "Usuário adicionado",
        description: "O usuário foi adicionado com sucesso e receberá um email de convite.",
      });
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Erro ao adicionar usuário",
        description: "Ocorreu um erro ao adicionar o usuário.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Usuário</DialogTitle>
        </DialogHeader>
        <AddCollaboratorForm clientId={clientId} onSubmit={handleAddCollaborator} />
      </DialogContent>
    </Dialog>
  );
}
