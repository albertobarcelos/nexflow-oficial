import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Partner } from "@/types/partner";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewIndicationDialogProps {
  partner: Partner;
  open: boolean;
  onClose: () => void;
}

interface FormData {
  companyName: string;
  companyCNPJ: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export function NewIndicationDialog({ partner, open, onClose }: NewIndicationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    companyCNPJ: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    console.log("Tentando salvar indicação:", formData);

    // Validações básicas
    if (!formData.companyName || !formData.companyCNPJ || !formData.contactName || !formData.contactEmail || !formData.contactPhone) {
      console.log("Campos obrigatórios faltando:", {
        hasName: !!formData.companyName,
        hasCNPJ: !!formData.companyCNPJ,
        hasContactName: !!formData.contactName,
        hasContactEmail: !!formData.contactEmail,
        hasContactPhone: !!formData.contactPhone
      });

      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Remover formatação do CNPJ antes de salvar
    const cleanCNPJ = formData.companyCNPJ.replace(/[^\d]/g, "");

    setIsLoading(true);

    try {
      console.log("Criando empresa...");
      // 1. Criar a empresa
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: formData.companyName,
          cnpj: cleanCNPJ,
          client_id: partner.client_id // Importante: adicionar client_id
        })
        .select()
        .single();

      if (companyError) {
        console.error("Erro ao criar empresa:", companyError);
        throw companyError;
      }

      console.log("Empresa criada:", company);

      console.log("Criando pessoa...");
      // 2. Criar a pessoa de contato
      const { data: person, error: personError } = await supabase
        .from("people")
        .insert({
          name: formData.contactName,
          email: formData.contactEmail,
          celular: formData.contactPhone,
          whatsapp: formData.contactPhone, // Adicionado: salvar também como whatsapp
          company_id: company.id,
          client_id: partner.client_id // Importante: adicionar client_id
        })
        .select()
        .single();

      if (personError) {
        console.error("Erro ao criar pessoa:", personError);
        throw personError;
      }

      console.log("Pessoa criada:", person);

      console.log("Criando indicação...");
      // 3. Criar a indicação
      const { error: indicationError } = await supabase
        .from("partner_indications")
        .insert({
          partner_id: partner.id,
          company_id: company.id,
          status: "PENDENTE",
          indication_date: new Date().toISOString(),
          client_id: partner.client_id // Importante: adicionar client_id
        });

      if (indicationError) {
        console.error("Erro ao criar indicação:", indicationError);
        throw indicationError;
      }

      console.log("Indicação criada com sucesso!");

      toast({
        title: "Sucesso",
        description: "Indicação cadastrada com sucesso",
      });

      // Atualizar cache do parceiro
      queryClient.invalidateQueries(["partners", partner.id]);

      onClose();
    } catch (error: any) {
      console.error("Erro ao cadastrar indicação:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar indicação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Indicação</DialogTitle>
          <DialogDescription>
            Indique uma empresa para o parceiro {partner.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dados da Empresa */}
          <div className="space-y-2">
            <Label>Dados da Empresa</Label>
            <Input
              placeholder="Nome da Empresa"
              value={formData.companyName}
              onChange={handleChange("companyName")}
            />
            <Input
              placeholder="CNPJ (XX.XXX.XXX/XXXX-XX)"
              value={formData.companyCNPJ}
              onChange={handleChange("companyCNPJ")}
            />
          </div>

          {/* Dados do Contato */}
          <div className="space-y-2">
            <Label>Dados do Contato</Label>
            <Input
              placeholder="Nome do Contato"
              value={formData.contactName}
              onChange={handleChange("contactName")}
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange("contactEmail")}
            />
            <Input
              placeholder="Telefone"
              value={formData.contactPhone}
              onChange={handleChange("contactPhone")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
