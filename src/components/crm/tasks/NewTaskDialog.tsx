import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewTaskForm } from './NewTaskForm';

interface NewTaskDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
}

export function NewTaskDialog({ open, onClose, onSave }: NewTaskDialogProps) {
    const handleSave = (task: any) => {
        onSave(task);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Tarefa</DialogTitle>
                </DialogHeader>

                <NewTaskForm
                    onSave={handleSave}
                    onCancel={onClose}
                />
            </DialogContent>
        </Dialog>
    );
} 