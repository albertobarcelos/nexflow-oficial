import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomField } from "../types";
import { EntityFormField } from "@/components/crm/entities/form/EntityFormField";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: CustomField[];
  layout: "vertical" | "horizontal";
}

export function FormPreviewDialog({
  open,
  onOpenChange,
  fields,
  layout
}: FormPreviewDialogProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview do Formulário</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className={cn(
            "space-y-4",
            layout === "horizontal" && "grid grid-cols-2 gap-4 space-y-0"
          )}>
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <EntityFormField
                  field={field}
                  value={formValues[field.id]}
                  onChange={(value) => {
                    setFormValues(prev => ({
                      ...prev,
                      [field.id]: value
                    }));
                  }}
                  isSubmitting={false}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}