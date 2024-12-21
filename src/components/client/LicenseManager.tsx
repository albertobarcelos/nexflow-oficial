import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { License } from "@/types/database";

interface LicenseManagerProps {
  clientId: string;
  currentPlan: "free" | "premium";
}

export function LicenseManager({ clientId, currentPlan }: LicenseManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createLicense = async () => {
    setIsCreating(true);
    try {
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      const { error } = await supabase
        .from('licenses')
        .insert({
          client_id: clientId,
          type: currentPlan,
          expiration_date: expirationDate.toISOString(),
          status: 'active',
        } as License);

      if (error) throw error;

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
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciamento de Licença</h3>
        <Button
          onClick={createLicense}
          disabled={isCreating}
        >
          {isCreating ? "Criando..." : "Criar Nova Licença"}
        </Button>
      </div>
    </div>
  );
}