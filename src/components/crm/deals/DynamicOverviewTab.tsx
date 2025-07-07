import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronRight, 
  Save, 
  AlertCircle,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  Link,
  Hash,
  Type,
  AlignLeft,
  CheckSquare,
  Upload,
  User,
  Clock,
  Percent,
  Square,
  Circle,
  List,
  Filter
} from 'lucide-react';
import { useFlowOverviewLayout } from '@/hooks/useFlowOverviewLayouts';
import { FlowOverviewField, FlowOverviewSection, FieldType, FIELD_TYPES } from '@/types/flow-layouts';
import { MockDeal } from './DealViewDialog';
import { useToast } from '@/components/ui/use-toast';

interface DynamicOverviewTabProps {
  deal: MockDeal;
  flowId: string;
  onSaveData?: (data: Record<string, any>) => void;
}

interface FieldData {
  [key: string]: any;
}

export function DynamicOverviewTab({ deal, flowId, onSaveData }: DynamicOverviewTabProps) {
  const { layout, isLoading, error } = useFlowOverviewLayout(flowId);
  const { toast } = useToast();
  
  const [fieldData, setFieldData] = useState<FieldData>({});
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar dados dos campos
  useEffect(() => {
    if (layout && layout.sections) {
      const initialData: FieldData = {};
      layout.sections.forEach(section => {
        section.fields.forEach(field => {
          // Valores padrão baseados no tipo
          switch (field.type) {
            case 'checkbox':
              initialData[field.id] = false;
              break;
            case 'multiselect':
              initialData[field.id] = [];
              break;
            case 'number':
            case 'currency':
            case 'percentage':
              initialData[field.id] = 0;
              break;
            default:
              initialData[field.id] = '';
          }
        });
      });
      setFieldData(initialData);
    }
  }, [layout]);

  // Atualizar valor de campo
  const updateFieldValue = (fieldId: string, value: any) => {
    setFieldData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setHasChanges(true);
  };

  // Toggle seção colapsada
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Salvar dados
  const handleSave = () => {
    if (onSaveData) {
      onSaveData(fieldData);
    }
    setHasChanges(false);
    toast({
      title: 'Dados salvos',
      description: 'As informações foram salvas com sucesso.',
    });
  };

  // Renderizar campo baseado no tipo
  const renderField = (field: FlowOverviewField) => {
    const fieldType = FIELD_TYPES[field.type];
    const value = fieldData[field.id];
    const isRequired = field.required;
    const isHalfWidth = field.width === 'half';

    const fieldComponent = () => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'url':
          return (
            <Input
              value={value || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              placeholder={field.placeholder}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          );

        case 'textarea':
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
            />
          );

        case 'number':
          return (
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => updateFieldValue(field.id, Number(e.target.value) || 0)}
              placeholder={field.placeholder}
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          );

        case 'currency':
          return (
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={value || ''}
                onChange={(e) => updateFieldValue(field.id, Number(e.target.value) || 0)}
                placeholder={field.placeholder}
                className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          );

        case 'percentage':
          return (
            <div className="relative">
              <Input
                type="number"
                value={value || ''}
                onChange={(e) => updateFieldValue(field.id, Number(e.target.value) || 0)}
                placeholder={field.placeholder}
                className="pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                min="0"
                max="100"
              />
              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          );

        case 'date':
          return (
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          );

        case 'datetime':
          return (
            <Input
              type="datetime-local"
              value={value || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          );

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <Switch
                checked={value || false}
                onCheckedChange={(checked) => updateFieldValue(field.id, checked)}
              />
              <Label className="text-sm">{field.placeholder || 'Ativado'}</Label>
            </div>
          );

        case 'select':
          return (
            <Select value={value || ''} onValueChange={(val) => updateFieldValue(field.id, val)}>
              <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                <SelectValue placeholder={field.placeholder || 'Selecione uma opção'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'multiselect':
          return (
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${field.id}_${index}`}
                    checked={(value || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      updateFieldValue(field.id, newValues);
                    }}
                    className="rounded border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <Label htmlFor={`${field.id}_${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          );

        case 'radio':
          return (
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${field.id}_${index}`}
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => updateFieldValue(field.id, e.target.value)}
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <Label htmlFor={`${field.id}_${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          );

        case 'file':
          return (
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-slate-300 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500 mb-2">
                {field.placeholder || 'Clique para selecionar ou arraste arquivos aqui'}
              </p>
              <Button variant="outline" size="sm">
                Selecionar Arquivo
              </Button>
            </div>
          );

        default:
          return (
            <Input
              value={value || ''}
              onChange={(e) => updateFieldValue(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          );
      }
    };

    return (
      <div className={`space-y-2 ${isHalfWidth ? 'w-1/2' : 'w-full'}`}>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-slate-700">
            {field.label}
          </Label>
          {isRequired && (
            <Badge variant="destructive" className="text-xs">
              Obrigatório
            </Badge>
          )}
        </div>
        {fieldComponent()}
      </div>
    );
  };

  // Renderizar seção
  const renderSection = (section: FlowOverviewSection) => {
    const isCollapsed = collapsedSections.has(section.id);
    const hasFields = section.fields && section.fields.length > 0;

    return (
      <Card key={section.id} className="border-slate-200/60 shadow-sm">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => toggleSection(section.id)}
        >
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
              <span>{section.title}</span>
              {hasFields && (
                <Badge variant="outline" className="text-xs">
                  {section.fields.length} campo{section.fields.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent>
            {hasFields ? (
              <div className="space-y-4">
                {section.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field, index) => (
                    <div key={field.id}>
                      {renderField(field)}
                      {index < section.fields.length - 1 && field.width !== 'half' && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Nenhum campo configurado nesta seção</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  // Organizar seções por coluna
  const sectionsByColumn = layout?.sections ? {
    1: layout.sections.filter(s => s.column === 1).sort((a, b) => a.order - b.order),
  } : { 1: [] };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <h3 className="font-semibold text-red-800 mb-2">Erro ao carregar layout</h3>
          <p className="text-sm text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!layout || !layout.sections || layout.sections.length === 0) {
    return (
      <Card className="border-slate-200/60 shadow-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="font-semibold text-slate-700 mb-2">Layout não configurado</h3>
          <p className="text-sm text-slate-500 mb-4">
            Configure o layout da visão geral nas configurações do pipeline para personalizar esta tela.
          </p>
          <Button variant="outline" size="sm">
            Configurar Layout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de salvar */}
      {hasChanges && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Você tem alterações não salvas
            </span>
          </div>
          <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      )}

      {/* Layout em coluna única */}
      <div className="space-y-6">
        {sectionsByColumn[1].map(renderSection)}
      </div>
    </div>
  );
} 