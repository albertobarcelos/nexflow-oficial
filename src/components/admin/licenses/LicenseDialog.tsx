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
import { supabase } from "@/integrations/supabase/client";
import type { License } from "@/types/database";

interface LicenseDialogProps {
  clients?: { id: string; name: string; }[];
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

    setIsCreating(true);
    try {
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      const { error } = await supabase
        .from('licenses')
        .insert({
          client_id: selectedClient,
          type: selectedPlan,
          expiration_date: expirationDate.toISOString(),
          status: 'active',
        } as License);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "A licença foi criada com sucesso.",
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