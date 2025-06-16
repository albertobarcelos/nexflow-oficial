import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddDealDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    company_id?: string;
    person_id?: string;
    value?: number;
  }) => Promise<void>;
  allowedEntities?: string[];
}

export function AddDealDialog({ open, onClose, onAdd, allowedEntities }: AddDealDialogProps) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onAdd({
        title: title.trim(),
        value: value ? parseFloat(value) : undefined,
      });
      setTitle("");
      setValue("");
      onClose();
    } catch (error) {
      console.error("Erro ao criar negócio:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Negócio</DialogTitle>
          <DialogDescription>
            Crie um novo negócio no seu funil de vendas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Nome do negócio"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Valor
              </Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="col-span-3"
                placeholder="0,00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Criando..." : "Criar Negócio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
