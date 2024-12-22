import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { License } from "@/types/database";

export default function Licenses() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("free");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { data: licenses, isLoading, refetch } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select(`
          *,
          clients (
            name,
            email,
            plan
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (License & { clients: { name: string; email: string; plan: string } })[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

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
        title: "Licença criada",
        description: "A licença foi criada com sucesso.",
      });

      refetch();
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

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Licenças</h1>
          <p className="text-muted-foreground">
            Gerencie as licenças dos clientes
          </p>
        </div>

        <Dialog>
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
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Plano Atual</th>
              <th className="p-4 text-left">Tipo da Licença</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Início</th>
              <th className="p-4 text-left">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {licenses?.map((license) => (
              <tr key={license.id} className="border-b">
                <td className="p-4">{license.clients.name}</td>
                <td className="p-4">{license.clients.plan}</td>
                <td className="p-4">{license.type}</td>
                <td className="p-4">{license.status}</td>
                <td className="p-4">
                  {new Date(license.start_date).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {new Date(license.expiration_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}