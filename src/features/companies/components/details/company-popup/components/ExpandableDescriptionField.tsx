// AIDEV-NOTE: Componente específico para campo de descrição com funcionalidade de expansão

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableDescriptionFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  onSave: (value: string) => Promise<void> | void;
  className?: string;
  disabled?: boolean;
  maxLines?: number; // Número máximo de linhas antes de mostrar "Ver mais"
}

export const ExpandableDescriptionField: React.FC<ExpandableDescriptionFieldProps> = ({
  label,
  value = '',
  placeholder,
  onSave,
  className,
  disabled = false,
  maxLines = 3
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // AIDEV-NOTE: Verificar se o texto é longo o suficiente para precisar de expansão
  const needsExpansion = () => {
    if (!value) return false;
    const lines = value.split('\n');
    return lines.length > maxLines || value.length > 200;
  };

  // AIDEV-NOTE: Obter texto truncado para exibição
  const getTruncatedText = () => {
    if (!value) return 'Adicionar';
    if (!needsExpansion() || isExpanded) return value;
    
    const lines = value.split('\n');
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + '...';
    }
    
    if (value.length > 200) {
      return value.substring(0, 200) + '...';
    }
    
    return value;
  };

  const displayText = getTruncatedText();
  const isEmpty = !value || value.trim() === '';

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="min-h-[120px]"
            rows={6}
          />
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
        <div className="space-y-2">
          <div 
            className="group relative text-sm min-h-[20px] flex items-start justify-between cursor-pointer hover:bg-gray-50 rounded-md px-2 py-2 -mx-2 -my-2 transition-colors"
            onClick={handleEdit}
          >
            <div className="flex-1 space-y-2">
              <div className={cn(
                "whitespace-pre-wrap",
                isEmpty ? "text-blue-600 font-medium" : "text-gray-900"
              )}>
                {displayText}
              </div>
              
              {needsExpansion() && !isEmpty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded();
                  }}
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Ver mais
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:bg-gray-200 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};