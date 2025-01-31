import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyQuickForm } from "./company-quick-form";

interface CompanyQuickDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompanyCreated?: (company: { id: string; name: string; razao_social?: string | null }) => void;
  initialName?: string;
}

export function CompanyQuickDialog({
  open,
  onOpenChange,
  onCompanyCreated,
  initialName,
}: CompanyQuickDialogProps) {
  const handleSuccess = (company: { id: string; name: string; razao_social?: string | null }) => {
    onCompanyCreated?.(company);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Empresa</DialogTitle>
        </DialogHeader>
        <CompanyQuickForm 
          onSuccess={handleSuccess} 
          initialName={initialName}
        />
      </DialogContent>
    </Dialog>
  );
}
