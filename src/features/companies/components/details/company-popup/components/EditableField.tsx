// AIDEV-NOTE: Componente reutilizável para campos editáveis com ícone de lápis

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'combobox';
  options?: { value: string; label: string }[];
  required?: boolean;
  mask?: string;
  validation?: (value: string) => string | null;
  onSave: (value: string) => Promise<void> | void;
  className?: string;
  disabled?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value = '',
  placeholder,
  type = 'text',
  options = [],
  required = false,
  mask,
  validation,
  onSave,
  className,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (required && !editValue.trim()) {
      setError('Este campo é obrigatório');
      return;
    }

    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const applyMask = (inputValue: string): string => {
    if (!mask) return inputValue;
    
    // Remove todos os caracteres não numéricos
    const numbers = inputValue.replace(/\D/g, '');
    
    if (mask === 'phone') {
      // Máscara para telefone: (11) 99999-9999
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (mask === 'cnpj') {
      // Máscara para CNPJ: 11.111.111/0001-11
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (mask === 'cep') {
      // Máscara para CEP: 11111-111
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    
    return inputValue;
  };

  const handleInputChange = (newValue: string) => {
    const maskedValue = applyMask(newValue);
    setEditValue(maskedValue);
  };

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          value={editValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px]"
        />
      );
    }

    if (type === 'select' && options.length > 0) {
      return (
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === 'combobox' && options.length > 0) {
      return (
        <Combobox
          options={options}
          value={editValue}
          onValueChange={setEditValue}
          placeholder={placeholder}
          searchPlaceholder="Buscar..."
          emptyText="Nenhum resultado encontrado"
        />
      );
    }

    return (
      <Input
        type={type}
        value={editValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  };

  const displayValue = value || placeholder || 'Não informado';

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            disabled={disabled}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {renderInput()}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-7"
            >
              <Check className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-7"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-900 min-h-[20px] flex items-center">
          {displayValue}
        </div>
      )}
    </div>
  );
};