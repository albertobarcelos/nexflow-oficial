import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  X, 
  AlertCircle,
  DollarSign,
  Phone,
  Mail,
  Link as LinkIcon,
  Hash,
  Type,
  AlignLeft,
  Building2,
  User,
  Handshake,
  GraduationCap,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EntityField, CreateEntityRecordData } from '@/hooks/useDealEntityData';

interface EntityFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateEntityRecordData) => void;
  entityId: string;
  entityName: string;
  entitySlug: string;
  fields: EntityField[];
  isLoading?: boolean;
  // Para edição
  initialData?: {
    recordId: string;
    title: string;
    data: Record<string, any>;
  };
}

// Mapeamento de ícones por slug da entidade
const getEntityIcon = (slug: string) => {
  const iconMap: Record<string, any> = {
    companies: Building2,
    people: User,
    partners: Handshake,
    cursos: GraduationCap,
    imoveis: Home,
  };
  return iconMap[slug] || Building2;
};

// Mapeamento de cores por slug da entidade
const getEntityColor = (slug: string) => {
  const colorMap: Record<string, string> = {
    companies: 'bg-blue-500',
    people: 'bg-green-500',
    partners: 'bg-orange-500',
    cursos: 'bg-purple-500',
    imoveis: 'bg-indigo-500',
  };
  return colorMap[slug] || 'bg-blue-500';
};

export function EntityFormModal({
  open,
  onClose,
  onSave,
  entityId,
  entityName,
  entitySlug,
  fields,
  isLoading = false,
  initialData
}: EntityFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const EntityIcon = getEntityIcon(entitySlug);
  const isEditing = !!initialData;

  // Inicializar formulário
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Modo edição
        setTitle(initialData.title);
        setFormData(initialData.data || {});
      } else {
        // Modo criação
        const initialFormData: Record<string, any> = {};
        fields.forEach(field => {
          switch (field.field_type) {
            case 'checkbox':
              initialFormData[field.slug] = false;
              break;
            case 'multi_select':
              initialFormData[field.slug] = [];
              break;
            case 'number':
            case 'currency':
              initialFormData[field.slug] = '';
              break;
            default:
              initialFormData[field.slug] = '';
          }
        });
        setFormData(initialFormData);
        setTitle('');
      }
      setErrors({});
    }
  }, [open, fields, initialData]);

  // Atualizar valor do campo
  const updateFieldValue = (fieldSlug: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldSlug]: value
    }));
    
    // Limpar erro do campo
    if (errors[fieldSlug]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldSlug];
        return newErrors;
      });
    }
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar título
    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    // Validar campos obrigatórios
    fields.forEach(field => {
      if (field.is_required) {
        const value = formData[field.slug];
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field.slug] = `${field.name} é obrigatório`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar dados
  const handleSave = () => {
    if (!validateForm()) return;

    const saveData: CreateEntityRecordData = {
      entityId,
      title: title.trim(),
      data: formData,
      isPrimary: false
    };

    onSave(saveData);
  };

  // Renderizar campo baseado no tipo
  const renderField = (field: EntityField) => {
    const value = formData[field.slug];
    const hasError = !!errors[field.slug];

    const fieldComponent = () => {
      switch (field.field_type) {
        case 'short_text':
          return (
            <Input
              value={value || ''}
              onChange={(e) => updateFieldValue(field.slug, e.target.value)}
              placeholder={`Digite ${field.name.toLowerCase()}`}
              className={cn(
                "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                hasError && "border-red-500 focus:border-red-500"
              )}
            />
          );

        case 'long_text':
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => updateFieldValue(field.slug, e.target.value)}
              placeholder={`Digite ${field.name.toLowerCase()}`}
              rows={3}
              className={cn(
                "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none",
                hasError && "border-red-500 focus:border-red-500"
              )}
            />
          );

        case 'email':
          return (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                value={value || ''}
                onChange={(e) => updateFieldValue(field.slug, e.target.value)}
                placeholder={`Digite ${field.name.toLowerCase()}`}
                className={cn(
                  "pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                  hasError && "border-red-500 focus:border-red-500"
                )}
              />
            </div>
          );

        case 'phone':
          return (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="tel"
                value={value || ''}
                onChange={(e) => updateFieldValue(field.slug, e.target.value)}
                placeholder={`Digite ${field.name.toLowerCase()}`}
                className={cn(
                  "pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                  hasError && "border-red-500 focus:border-red-500"
                )}
              />
            </div>
          );

        case 'url':
          return (
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="url"
                value={value || ''}
                onChange={(e) => updateFieldValue(field.slug, e.target.value)}
                placeholder={`Digite ${field.name.toLowerCase()}`}
                className={cn(
                  "pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                  hasError && "border-red-500 focus:border-red-500"
                )}
              />
            </div>
          );

        case 'number':
          return (
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={value || ''}
                onChange={(e) => updateFieldValue(field.slug, Number(e.target.value) || '')}
                placeholder={`Digite ${field.name.toLowerCase()}`}
                className={cn(
                  "pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                  hasError && "border-red-500 focus:border-red-500"
                )}
              />
            </div>
          );

        case 'currency':
          return (
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                value={value || ''}
                onChange={(e) => updateFieldValue(field.slug, Number(e.target.value) || '')}
                placeholder={`Digite ${field.name.toLowerCase()}`}
                className={cn(
                  "pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                  hasError && "border-red-500 focus:border-red-500"
                )}
              />
            </div>
          );

        case 'single_select':
          return (
            <Select
              value={value || ''}
              onValueChange={(val) => updateFieldValue(field.slug, val)}
            >
              <SelectTrigger className={cn(
                "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                hasError && "border-red-500 focus:border-red-500"
              )}>
                <SelectValue placeholder={`Selecione ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options && field.options.length > 0 ? (
                  field.options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="option1">Opção 1</SelectItem>
                )}
              </SelectContent>
            </Select>
          );

        default:
          return (
            <Input
              value={value || ''}
              onChange={(e) => updateFieldValue(field.slug, e.target.value)}
              placeholder={`Digite ${field.name.toLowerCase()}`}
              className={cn(
                "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                hasError && "border-red-500 focus:border-red-500"
              )}
            />
          );
      }
    };

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.slug} className="text-sm font-medium text-slate-700 flex items-center gap-1">
          {field.name}
          {field.is_required && <span className="text-red-500">*</span>}
        </Label>
        {fieldComponent()}
        {hasError && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            {errors[field.slug]}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800">
            <div className={cn("p-2 rounded-lg", getEntityColor(entitySlug))}>
              <EntityIcon className="w-5 h-5 text-white" />
            </div>
            {isEditing ? `Editar ${entityName}` : `Adicionar ${entityName}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
            {/* Campo Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                Título/Nome Principal
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Nome principal ${entityName.toLowerCase()}`}
                className={cn(
                  "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                  errors.title && "border-red-500 focus:border-red-500"
                )}
              />
              {errors.title && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </div>
              )}
            </div>

            <Separator />

            {/* Campos Dinâmicos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Informações Detalhadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(renderField)}
              </div>
            </div>

            {fields.length === 0 && (
              <Card className="border-dashed border-slate-300">
                <CardContent className="pt-6 text-center">
                  <Type className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    Nenhum campo configurado para esta entidade
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure campos na seção de entidades
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-slate-200 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 