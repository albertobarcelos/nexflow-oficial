import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomField } from "../types";
import { cn } from "@/lib/utils";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview do Formulário</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className={cn(
            "grid gap-4",
            layout === "horizontal" ? "grid-cols-2" : "grid-cols-1"
          )}>
            {fields.map((field) => {
              const layoutConfig = field.layout_config || {
                width: 'full',
                forceNewLine: false,
                groupWithNext: false
              };

              return (
                <div
                  key={field.id}
                  className={cn(
                    "space-y-2 p-4 border rounded-lg",
                    layoutConfig.width === 'full' && "col-span-2",
                    layoutConfig.width === 'half' && "col-span-1",
                    layoutConfig.width === 'third' && "col-span-1",
                    layoutConfig.forceNewLine && "col-span-2",
                    layoutConfig.groupWithNext && "border-primary/30"
                  )}
                >
                  <label className="text-sm font-medium">{field.name}</label>
                  <div className="h-10 bg-muted rounded-md"></div>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}