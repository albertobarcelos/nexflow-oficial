import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePartners } from "@/hooks/usePartners";
import { toast } from "sonner";

interface AddPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPartnerDialog({ open, onOpenChange, onSuccess }: AddPartnerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPartner } = usePartners();

  // Função para gerar avatar aleatório
  const generateRandomAvatar = () => {
    const totalNumber = Math.floor(Math.random() * 36) + 1; // 1-36
    const group = totalNumber <= 18 ? 1 : 2;
    const toyNumber = totalNumber <= 18 ? totalNumber : totalNumber - 18;
    return `${toyNumber}|${group}`;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = {
        name: formData.get("name") as string,
        whatsapp: formData.get("whatsapp") as string,
        email: formData.get("email") as string,
        partner_type: formData.get("partner_type") as string,
        avatar_type: "toy_face",
        avatar_seed: generateRandomAvatar(),
        status: "ATIVO" // Status padrão
      };

      await createPartner(data);
      toast.success("Parceiro adicionado com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao adicionar parceiro");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Parceiro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required />
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input id="whatsapp" name="whatsapp" required />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div>
            <Label htmlFor="partner_type">Tipo de Parceiro *</Label>
            <Select name="partner_type" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AFILIADO">Afiliado</SelectItem>
                <SelectItem value="AGENTE_STONE">Agente Stone</SelectItem>
                <SelectItem value="CONTADOR">Contador</SelectItem>
                <SelectItem value="DISTRIBUIDOR">Distribuidor</SelectItem>
                <SelectItem value="REPRESENTANTE">Representante</SelectItem>
                <SelectItem value="REVENDA">Revenda</SelectItem>
                <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
