import { useCustomFields } from "@/hooks/useCustomFields";
import { useCustomFieldValues } from "@/hooks/useCustomFieldValues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContactCustomFieldsProps {
  contactId: string;
  onSave?: () => void;
}

export function ContactCustomFields({ contactId, onSave }: ContactCustomFieldsProps) {
  const { data: customFields } = useCustomFields("contact");
  const {
    values,
    isLoading,
    updateFieldValue,
    isSaving,
  } = useCustomFieldValues("contact", contactId);

  if (isLoading || !customFields?.length) {
    return null;
  }

  const handleFieldChange = async (fieldId: string, value: string | boolean | number) => {
    await updateFieldValue(fieldId, value);
    onSave?.();
  };

  const renderField = (field: any) => {
    const value = values?.[field.id];

    switch (field.field_type) {
      case "text":
        return (
          <Input
            value={value as string || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Digite o ${field.name.toLowerCase()}`}
            disabled={isSaving}
          />
        );
      case "textarea":
        return (
          <Textarea
            value={value as string || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Digite o ${field.name.toLowerCase()}`}
            className="resize-none"
            disabled={isSaving}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value as number || ""}
            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
            placeholder={`Digite o ${field.name.toLowerCase()}`}
            disabled={isSaving}
          />
        );
      case "boolean":
        return (
          <Switch
            checked={value as boolean || false}
            onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            disabled={isSaving}
          />
        );
      case "select":
        return (
          <Select
            value={value as string || ""}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecione o ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {customFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>{field.name}</Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
} 
