import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CompanyPopup({ company, open, onClose }: { company: any, open: boolean, onClose: () => void }) {
    if (!company) return null;
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{company.name}</DialogTitle>
                </DialogHeader>
                <div>
                    <pre>{JSON.stringify(company, null, 2)}</pre>
                </div>
            </DialogContent>
        </Dialog>
    );
} 