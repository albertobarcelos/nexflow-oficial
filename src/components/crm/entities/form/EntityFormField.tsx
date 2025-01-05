import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EntityRelationshipField } from "../EntityRelationshipField";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import InputMask from "react-input-mask";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EntityFormFieldProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
  isSubmitting: boolean;
}

export function EntityFormField({ field, value, onChange, isSubmitting }: EntityFormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const { data: collaborators } = useQuery({
    queryKey: ['collaborators'],
    enabled: field.field_type === 'user',
    queryFn: async () => {
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Collaborator not found');

      const { data, error } = await supabase
        .from('collaborators')
        .select('id, name, role')
        .eq('client_id', collaborator.client_id);

      if (error) throw error;
      return data;
    }
  });

  if (field.field_type === 'entity') {
    return (
      <EntityRelationshipField
        entityId={field.related_entity_id}
        fieldId={field.id}
        value={value}
        onChange={onChange}
        disabled={isSubmitting}
      />
    );
  }

  // Handle user selection field
  if (field.field_type === 'user') {
    return (
      <Select
        value={value}
        onValueChange={onChange}
        disabled={isSubmitting}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um usuário" />
        </SelectTrigger>
        <SelectContent>
          {collaborators?.map((collaborator) => (
            <SelectItem key={collaborator.id} value={collaborator.id}>
              {collaborator.name} ({collaborator.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Handle masked inputs
  if (field.validation_rules?.mask) {
    return (
      <InputMask
        mask={field.validation_rules.mask}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isSubmitting}
      >
        {(inputProps: any) => (
          <Input
            {...inputProps}
            id={field.id}
            required={field.is_required}
            placeholder={`Digite ${field.name.toLowerCase()}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full transition-all duration-200",
              field.is_required && !value && "border-red-500 focus:border-red-500",
              isFocused && "ring-2 ring-primary/20"
            )}
          />
        )}
      </InputMask>
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