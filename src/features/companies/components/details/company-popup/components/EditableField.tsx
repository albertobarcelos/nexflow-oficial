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
          items={options.map(opt => ({ value: opt.value, label: opt.label }))}
          value={editValue}
          onChange={setEditValue}
          placeholder={placeholder}
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

  // AIDEV-NOTE: Para campos combobox, exibir o label correspondente ao value
  const getDisplayValue = () => {
    if (!value || value.trim() === '') return 'Adicionar';
    
    if ((type === 'combobox' || type === 'select')) {
      if (options.length > 0) {
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption ? selectedOption.label : `Carregando... (${value})`;
      } else {
        // Se as opções ainda não foram carregadas, mostrar que está carregando
        return `Carregando... (${value})`;
      }
    }
    
    return value;
  };

  const displayValue = getDisplayValue();

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

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
        <div 
          className="group relative text-sm min-h-[20px] flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors"
          onClick={handleEdit}
        >
          <span className={cn(
            "flex-1",
            (!value || value.trim() === '') ? "text-blue-600 font-medium" : "text-gray-900"
          )}>
            {displayValue}
          </span>
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};