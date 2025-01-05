import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EntityFormHeaderProps {
  entityName: string;
}

export function EntityFormHeader({ entityName }: EntityFormHeaderProps) {
  return (
    <DialogHeader className="p-6 pb-2">
      <DialogTitle>Novo {entityName}</DialogTitle>
      <DialogDescription>
        Preencha os campos abaixo para criar um novo registro.
      </DialogDescription>
    </DialogHeader>
  );
}