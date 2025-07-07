import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function CompanyForm({ company, open, onClose, onSuccess }: { company?: any, open: boolean, onClose: () => void, onSuccess?: () => void }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{company ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
                </DialogHeader>
                <div>
                    {/* Aqui vai o formulário real */}
                    <Button onClick={onSuccess}>Salvar (stub)</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 