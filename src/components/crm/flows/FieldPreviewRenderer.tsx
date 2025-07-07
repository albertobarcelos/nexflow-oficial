import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  Paperclip, 
  User, 
  Users, 
  Tag, 
  Hash,
  FileText,
  Database,
  Layers,
  CheckSquare,
  FileImage,
  Timer
} from 'lucide-react';
import { FieldConfiguration } from '@/types/form-builder';

interface FieldPreviewRendererProps {
  field: FieldConfiguration;
  showLabel?: boolean;
  compact?: boolean;
}

export function FieldPreviewRenderer({ 
  field, 
  showLabel = true, 
  compact = false 
}: FieldPreviewRendererProps) {
  const renderPreview = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder || 'Digite o texto...'}
            disabled
            className="bg-gray-50"
          />
        );

      case 'text-long':
        return (
          <Textarea
            placeholder={field.placeholder || 'Digite o texto longo...'}
            disabled
            className="bg-gray-50"
            rows={compact ? 2 : 3}
          />
        );

      case 'email':
        return (
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={field.placeholder || 'exemplo@email.com'}
              disabled
              className="bg-gray-50 pl-10"
            />
          </div>
        );

      case 'phone':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-lg">🇧🇷</span>
            <span className="text-gray-500">(99) 99999-9999</span>
          </div>
        );

      case 'number':
        return (
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              placeholder={field.placeholder || '0'}
              disabled
              className="bg-gray-50 pl-10"
            />
          </div>
        );

      case 'currency':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">R$ 0,00</span>
          </div>
        );

      case 'date':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">DD/MM/AAAA</span>
          </div>
        );

      case 'datetime':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">DD/MM/AAAA HH:MM</span>
          </div>
        );

      case 'time':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">HH:MM</span>
          </div>
        );

      case 'due-date':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <Timer className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">DD/MM/AAAA</span>
            <Badge variant="outline" className="ml-2 text-xs">
              Vencimento
            </Badge>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              className="rounded border-gray-300" 
              disabled 
            />
            <span className="text-sm text-gray-600">
              {field.placeholder || 'Opção de checkbox'}
            </span>
          </div>
        );

      case 'select':
        return (
          <div className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
            <span className="text-gray-500">
              {field.placeholder || 'Selecione uma opção...'}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        );

      case 'select-multiple':
        return (
          <div className="p-3 border rounded-lg bg-gray-50">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">Opção 1</Badge>
              <Badge variant="secondary" className="text-xs">Opção 2</Badge>
              <span className="text-gray-500 text-sm">+ mais opções</span>
            </div>
          </div>
        );

      case 'attachment':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Clique para anexar arquivos
            </p>
          </div>
        );

      case 'assignee':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Selecionar responsável</span>
          </div>
        );

      case 'tags':
        return (
          <div className="p-3 border rounded-lg bg-gray-50">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                Tag 1
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                Tag 2
              </Badge>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Documentos relacionados</span>
          </div>
        );

      case 'id':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-100">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 font-mono">#001</span>
            <Badge variant="outline" className="ml-2 text-xs">
              Auto
            </Badge>
          </div>
        );

      case 'dynamic-content':
        return (
          <Card className="bg-gray-50">
            <CardContent className="p-3">
              <div className="text-sm text-gray-500">
                <FileImage className="w-4 h-4 inline mr-1" />
                Conteúdo dinâmico baseado em regras
              </div>
            </CardContent>
          </Card>
        );

      case 'pipe-connection':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Conectar com outro pipe</span>
          </div>
        );

      case 'database-connection':
        return (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Conectar com database</span>
          </div>
        );

      default:
        return (
          <Input
            placeholder={field.placeholder || 'Campo personalizado'}
            disabled
            className="bg-gray-50"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {field.label}
          </Label>
          {field.required && (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              *
            </Badge>
          )}
        </div>
      )}
      
      {renderPreview()}
      
      {field.description && (
        <p className="text-xs text-gray-500 mt-1">
          {field.description}
        </p>
      )}
      
      {field.helpText && (
        <p className="text-xs text-blue-600 mt-1">
          💡 {field.helpText}
        </p>
      )}
    </div>
  );
} 