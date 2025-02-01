import { useState } from "react";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { Database } from "@/types/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CompanyForm } from "./form/CompanyForm";

type Company = Database["public"]["Tables"]["companies"]["Row"];

interface EditCompanyDialogProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCompanyDialog({ company, open, onOpenChange }: EditCompanyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateCompany } = useCompanies();

  const handleSuccess = async () => {
    setIsSubmitting(false);
    onOpenChange(false);
    toast.success("Empresa atualizada com sucesso!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Atualize os dados da empresa {company.name}
          </DialogDescription>
        </DialogHeader>

        <CompanyForm
          company={company}
          onSuccess={handleSuccess}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
