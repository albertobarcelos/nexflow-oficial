import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface QuickCompanyDialogProps {
  onCompanyCreated?: (companyId: string, companyName: string) => void;
}

// Função de formatação de CNPJ
const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substr(0, 18);
};

export function QuickCompanyDialog({ onCompanyCreated }: QuickCompanyDialogProps) {
  console.log('QuickCompanyDialog component rendered');

  const { createCompany } = useCompanies();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remova o aria-hidden do diálogo ao abrir
  useEffect(() => {
    if (isOpen) {
      const dialogElement = document.querySelector('[role="dialog"]');
      dialogElement?.removeAttribute('aria-hidden');
      dialogElement?.setAttribute('tabindex', '-1');
      dialogElement?.focus();
    }
  }, [isOpen]);

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    e.target.value = formatted;
  };

  const handleCreateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submission started');
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const companyData = {
        name: formData.get("razao_social") as string,
        cnpj: formData.get("cnpj") as string || null,
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        estado: "",
        complemento: "",
      };
      console.log('Company data prepared:', companyData);

      const newCompanyId = await createCompany.mutateAsync(companyData);
      console.log('Company created with ID:', newCompanyId);

      if (onCompanyCreated) {
        onCompanyCreated(newCompanyId, companyData.name);
      }

      // Limpa o formulário
      e.currentTarget.reset();
      
      // Fecha apenas este popup
      setIsOpen(false);
      console.log('Dialog closed after company creation');
      
      toast.success("Empresa criada com sucesso!");
    } catch (error) {
      console.error('Error during company creation:', error);
      toast.error("Erro ao criar empresa");
    } finally {
      setIsSubmitting(false);
      console.log('Form submission ended');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('Dialog open state changed:', open);
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>Nova Empresa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar nova empresa</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar uma nova empresa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateCompany} className="space-y-4 mt-4">
          <Input
            name="razao_social"
            placeholder="Razão Social"
            required
          />
          <Input
            name="cnpj"
            placeholder="00.000.000/0000-00"
            onChange={handleCNPJChange}
            maxLength={18}
            required
          />
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar empresa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}