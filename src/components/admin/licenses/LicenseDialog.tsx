import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { License } from "@/types/database";
import { v4 as uuidv4 } from 'uuid';

interface LicenseDialogProps {
  clients?: { id: string; name: string; email: string; }[];
  onSuccess: () => void;
}

export function LicenseDialog({ clients, onSuccess }: LicenseDialogProps) {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("free");
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const createLicense = async () => {
    if (!selectedClient) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para criar a licença.",
        variant: "destructive",
      });
      return;
    }

    const selectedClientData = clients?.find(client => client.id === selectedClient);
    if (!selectedClientData) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      // Criar a licença
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          client_id: selectedClient,
          type: selectedPlan,
          expiration_date: expirationDate.toISOString(),
          status: 'active',
        } as License)
        .select()
        .single();

      if (licenseError) throw licenseError;

      // Criar o usuário administrador
      const pendingAuthId = uuidv4();
      const { error: collaboratorError } = await supabase
        .from('collaborators')
        .insert({
          client_id: selectedClient,
          license_id: licenseData.id,
          name: selectedClientData.name,
          email: selectedClientData.email,
          role: 'administrator',
          auth_user_id: pendingAuthId,
          permissions: ['admin'],
        });

      if (collaboratorError) throw collaboratorError;

      // Enviar convite para o usuário
      const { error: inviteError } = await supabase.functions.invoke('send-invite', {
        body: {
          collaboratorId: licenseData.id,
          name: selectedClientData.name,
          email: selectedClientData.email,
          inviteUrl: `${window.location.origin}/collaborator/set-password`,
        },
      });

      if (inviteError) throw inviteError;

      toast({
        title: "Sucesso!",
        description: "A licença foi criada e o convite enviado para o usuário administrador.",
      });
      
      setOpen(false);
      onSuccess();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova Licença</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Licença</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select
              value={selectedClient}
              onValueChange={setSelectedClient}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Plano</label>
            <Select
              value={selectedPlan}
              onValueChange={(value: "free" | "premium") => setSelectedPlan(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={createLicense}
            disabled={isCreating}
          >
            {isCreating ? "Criando..." : "Criar Licença"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
