import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddCollaboratorFormProps {
  clientId: string;
  onSuccess: () => void;
}

export function AddCollaboratorForm({ clientId, onSuccess }: AddCollaboratorFormProps) {
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [newCollaboratorName, setNewCollaboratorName] = useState("");
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<"closer" | "partnership_director" | "partner">("closer");
  const { toast } = useToast();

  const addCollaborator = async () => {
    if (!newCollaboratorEmail || !newCollaboratorName || !newCollaboratorRole) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para adicionar um colaborador.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('collaborators')
        .insert({
          client_id: clientId,
          name: newCollaboratorName,
          email: newCollaboratorEmail,
          role: newCollaboratorRole,
          permissions: []
        });

      if (error) throw error;

      toast({
        title: "Colaborador adicionado",
        description: "O colaborador foi adicionado com sucesso.",
      });

      onSuccess();
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={newCollaboratorName}
          onChange={(e) => setNewCollaboratorName(e.target.value)}
          placeholder="Nome do colaborador"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={newCollaboratorEmail}
          onChange={(e) => setNewCollaboratorEmail(e.target.value)}
          placeholder="email@exemplo.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Função</Label>
        <Select
          value={newCollaboratorRole}
          onValueChange={(value: "closer" | "partnership_director" | "partner") => setNewCollaboratorRole(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="closer">Closer</SelectItem>
            <SelectItem value="partnership_director">Diretor de Parcerias</SelectItem>
            <SelectItem value="partner">Parceiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={addCollaborator}>
        Adicionar Colaborador
      </Button>
    </div>
  );
}