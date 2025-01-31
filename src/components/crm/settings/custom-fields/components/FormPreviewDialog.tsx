import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomField, EntityField } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: (CustomField | EntityField)[];
  layout: "vertical" | "horizontal";
}

export function FormPreviewDialog({ open, onOpenChange, fields, layout }: FormPreviewDialogProps) {
  const renderField = (field: CustomField | EntityField) => {
    const commonProps = {
      id: field.id,
      placeholder: `Digite ${field.name.toLowerCase()}...`,
      disabled: true,
      className: "bg-muted/50"
    };

    switch (field.field_type) {
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.id} disabled />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.description || field.name}
            </Label>
          </div>
        );

      case "list":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.name.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "long_text":
        return <Textarea {...commonProps} />;

      case "document":
        return <Input {...commonProps} placeholder="000.000.000-00 ou 00.000.000/0000-00" />;

      case "celular":
        return <Input {...commonProps} placeholder="(00) 00000-0000" />;

      case "currency":
        return <Input {...commonProps} placeholder="R$ 0,00" />;

      case "date":
        return <Input {...commonProps} type="date" />;

      case "datetime":
        return <Input {...commonProps} type="datetime-local" />;

      case "time":
        return <Input {...commonProps} type="time" />;

      case "email":
        return <Input {...commonProps} type="email" placeholder="email@exemplo.com" />;

      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview do Formulário</DialogTitle>
        </DialogHeader>
        
        <Card className="p-6">
          <div className="flex flex-wrap gap-4">
            {fields.map((field) => {
              const width = field.layout_config?.width || 'full';
              const widthClass = width === 'full' ? 'w-full' : width === 'half' ? 'w-[calc(50%-0.5rem)]' : 'w-[calc(33.33%-0.67rem)]';
              
              return (
                <div key={field.id} className={cn(widthClass, "space-y-2")}>
                  <Label htmlFor={field.id} className="font-medium">
                    {field.name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.description && (
                    <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
                  )}
                  {renderField(field)}
                </div>
              );
            })}
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
