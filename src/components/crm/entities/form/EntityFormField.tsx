import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EntityRelationshipField } from "../EntityRelationshipField";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EntityFormFieldProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
  isSubmitting: boolean;
}

export function EntityFormField({ field, value, onChange, isSubmitting }: EntityFormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  if (field.field_type === 'entity') {
    return (
      <EntityRelationshipField
        entityId={field.related_entity_id}
        fieldId={field.id}
        value={value}
        onChange={onChange}
        disabled={isSubmitting}
        onCreateNew={() => {
          console.log('Criar novo registro relacionado');
        }}
      />
    );
  }

  return (
    <Input
      id={field.id}
      type={field.field_type === 'number' ? 'number' : 'text'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.is_required}
      placeholder={`Digite ${field.name.toLowerCase()}`}
      disabled={isSubmitting}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "w-full transition-all duration-200",
        field.is_required && !value && "border-red-500 focus:border-red-500",
        isFocused && "ring-2 ring-primary/20"
      )}
    />
  );
}