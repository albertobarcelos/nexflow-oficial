import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateEntityDialogProps } from "../types";
import { EntityFieldEditor } from "./EntityFieldEditor";

export function CreateEntityDialog({ open, onOpenChange }: CreateEntityDialogProps) {
  const [fields, setFields] = useState([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Entidade</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Entidade</Label>
            <Input id="name" placeholder="Ex: Parceiros" />
          </div>

          <div className="space-y-2">
            <Label>Campos</Label>
            <EntityFieldEditor fields={fields} onChange={setFields} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button>Criar Entidade</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}