import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fieldTypes } from "../data/fieldTypes";
import { CustomField } from "../types";
import { toast } from "sonner";
import { useState } from "react";

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntityId: string;
  onAddField: (field: CustomField) => void;
}

export function AddFieldDialog({ open, onOpenChange, selectedEntityId, onAddField }: AddFieldDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFieldTypes = fieldTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Campo</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar tipo de campo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[60vh]">
          <div className="grid grid-cols-2 gap-4 p-4">
            {filteredFieldTypes.map((fieldType) => (
              <Card
                key={fieldType.id}
                className="p-4 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => {
                  if (!selectedEntityId) return;
                  
                  const newField: CustomField = {
                    id: crypto.randomUUID(),
                    name: fieldType.name,
                    field_type: fieldType.id,
                    description: fieldType.description,
                    is_required: false,
                    order_index: 0,
                    client_id: "",
                    pipeline_id: selectedEntityId,
                    stage_id: selectedEntityId,
                    options: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };

                  onAddField(newField);
                  onOpenChange(false);
                  toast.success("Campo adicionado com sucesso!");
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-primary/5">
                    {fieldType.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{fieldType.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {fieldType.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}