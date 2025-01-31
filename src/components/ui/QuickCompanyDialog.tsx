import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CompanyQuickForm } from "@/components/ui/company-quick-form";
import { Building2 } from "lucide-react";

interface QuickCompanyDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompanyCreated?: (company: { id: string; name: string }) => void;
  initialName?: string;
}

export function QuickCompanyDialog({
  open,
  onOpenChange,
  onCompanyCreated,
  initialName,
}: QuickCompanyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nova Empresa
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar uma nova empresa
          </DialogDescription>
        </DialogHeader>

        <CompanyQuickForm
          onSuccess={onCompanyCreated}
          initialName={initialName}
        />
      </DialogContent>
    </Dialog>
  );
}
