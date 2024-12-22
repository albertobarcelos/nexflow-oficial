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
import { useQuery } from "@tanstack/react-query";
import { AddCollaboratorForm } from "./license/AddCollaboratorForm";

interface AddCollaboratorDialogProps {
  clientId: string;
  onSuccess: () => void;
}

export function AddCollaboratorDialog({ clientId, onSuccess }: AddCollaboratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddCollaborator = async (data: any) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .insert({
          client_id: clientId,
          ...data,
        });

      if (error) throw error;

      toast({
        title: "Colaborador adicionado",
        description: "O colaborador foi adicionado com sucesso.",
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
    <>
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
          <AddCollaboratorForm onSubmit={handleAddCollaborator} />
        </DialogContent>
      </Dialog>
    </>
  );
}
