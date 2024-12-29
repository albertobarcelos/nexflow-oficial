import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CustomField } from "../settings/custom-fields/types";

interface CustomFieldRendererProps {
  field: CustomField;
  register: any;
  setValue: (name: string, value: any) => void;
  watch: any;
}

export function CustomFieldRenderer({ field, register, setValue, watch }: CustomFieldRendererProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const renderField = () => {
    switch (field.field_type) {
      case 'short_text':
        return (
          <Input
            id={field.id}
            {...register(`customFields.${field.id}`)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );
      
      case 'long_text':
        return (
          <Textarea
            id={field.id}
            {...register(`customFields.${field.id}`)}
            placeholder={`Digite ${field.name.toLowerCase()}`}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            id={field.id}
            onCheckedChange={(checked) => {
              setValue(`customFields.${field.id}`, checked);
            }}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setValue(`customFields.${field.id}`, date);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return <Input id={field.id} {...register(`customFields.${field.id}`)} />;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}