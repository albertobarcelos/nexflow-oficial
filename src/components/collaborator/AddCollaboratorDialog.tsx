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
import { AddCollaboratorForm } from "@/components/client/license/AddCollaboratorForm";
import { CollaboratorFormData } from "@/lib/validations/collaborator";

interface AddCollaboratorDialogProps {
  clientId: string;
  onSuccess: () => void;
}

export function AddCollaboratorDialog({ clientId, onSuccess }: AddCollaboratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddCollaborator = async (data: CollaboratorFormData & { license_id: string }) => {
    try {
      const { error: collaboratorError } = await supabase
        .from('collaborators')
        .insert({
          client_id: clientId,
          license_id: data.license_id,
          name: data.name,
          email: data.email,
          role: data.role,
          permissions: [],
        });

      if (collaboratorError) throw collaboratorError;

      // Send invitation email
      const { error: inviteError } = await supabase.functions.invoke('send-invite', {
        body: {
          collaboratorId: data.license_id,
          name: data.name,
          email: data.email,
          inviteUrl: `${window.location.origin}/collaborator/set-password`,
        },
      });

      if (inviteError) throw inviteError;

      toast({
        title: "Colaborador adicionado",
        description: "O colaborador foi adicionado com sucesso e receberá um email de convite.",
      });
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast({
        title: "Erro ao adicionar colaborador",
        description: "Ocorreu um erro ao adicionar o colaborador.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Colaborador</DialogTitle>
        </DialogHeader>
        <AddCollaboratorForm clientId={clientId} onSubmit={handleAddCollaborator} />
      </DialogContent>
    </Dialog>
  );
}