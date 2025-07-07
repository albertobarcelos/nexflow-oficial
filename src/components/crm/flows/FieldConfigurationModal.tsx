import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Link, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Hash,
  DollarSign,
  Clock,
  User,
  Tag,
  Paperclip,
  CheckSquare,
  FileImage,
  Database,
  Layers
} from 'lucide-react';
import { FieldConfiguration, FieldConfigurationModalProps } from '@/types/form-builder';
import { FIELD_TYPES } from './FieldTypesSidebar';
import { FieldPreviewRenderer } from './FieldPreviewRenderer';

export function FieldConfigurationModal({ 
  open, 
  onOpenChange, 
  field, 
  onSave, 
  onCancel 
}: FieldConfigurationModalProps) {
  const [config, setConfig] = useState<FieldConfiguration | null>(null);

  useEffect(() => {
    if (field) {
      setConfig({ ...field });
    }
  }, [field]);

  if (!config) return null;

  const fieldType = FIELD_TYPES.find(ft => ft.id === config.type);
  const Icon = fieldType?.icon;

  const handleSave = () => {
    if (config) {
      onSave(config);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const updateConfig = (updates: Partial<FieldConfiguration>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    {fieldType?.label || config.type}
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {fieldType?.description || 'Configure as opções do campo'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Configurações */}
              <div className="w-1/2 p-6 space-y-6 overflow-y-auto border-r">
                {/* Título do campo */}
                <div className="space-y-2">
                  <Label htmlFor="field-label" className="text-sm font-medium">
                    Título do campo
                  </Label>
                  <Input
                    id="field-label"
                    value={config.label}
                    onChange={(e) => updateConfig({ label: e.target.value })}
                    placeholder="Digite o título do campo"
                  />
                </div>

                {/* Placeholder */}
                <div className="space-y-2">
                  <Label htmlFor="field-placeholder" className="text-sm font-medium">
                    Texto de exemplo
                  </Label>
                  <Input
                    id="field-placeholder"
                    value={config.placeholder || ''}
                    onChange={(e) => updateConfig({ placeholder: e.target.value })}
                    placeholder="Digite um texto de exemplo"
                  />
                </div>

                <Separator />

                {/* Opções de configuração */}
                <div className="space-y-4">
                  {/* Descrição */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Descrição</Label>
                      <p className="text-xs text-gray-500">
                        Adicione uma descrição ao campo
                      </p>
                    </div>
                    <Switch
                      checked={!!config.description}
                      onCheckedChange={(checked) => 
                        updateConfig({ description: checked ? '' : undefined })
                      }
                    />
                  </div>

                  {config.description !== undefined && (
                    <Textarea
                      value={config.description}
                      onChange={(e) => updateConfig({ description: e.target.value })}
                      placeholder="Digite a descrição do campo"
                      className="text-sm"
                    />
                  )}

                  {/* Texto de ajuda */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Texto de ajuda</Label>
                      <p className="text-xs text-gray-500">
                        Adicione um texto de ajuda
                      </p>
                    </div>
                    <Switch
                      checked={!!config.helpText}
                      onCheckedChange={(checked) => 
                        updateConfig({ helpText: checked ? '' : undefined })
                      }
                    />
                  </div>

                  {config.helpText !== undefined && (
                    <Input
                      value={config.helpText}
                      onChange={(e) => updateConfig({ helpText: e.target.value })}
                      placeholder="Digite o texto de ajuda"
                      className="text-sm"
                    />
                  )}

                  {/* Campo obrigatório */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Este campo é obrigatório</Label>
                      <p className="text-xs text-gray-500">
                        O campo deve ser preenchido
                      </p>
                    </div>
                    <Switch
                      checked={config.required}
                      onCheckedChange={(checked) => updateConfig({ required: checked })}
                    />
                  </div>

                  {/* Visualização compacta */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Visualização compacta</Label>
                      <p className="text-xs text-gray-500">
                        Exibir campo em tamanho reduzido
                      </p>
                    </div>
                    <Switch
                      checked={config.compactView}
                      onCheckedChange={(checked) => updateConfig({ compactView: checked })}
                    />
                  </div>

                  {/* Editável em outras fases */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Este campo é editável em outras fases</Label>
                      <p className="text-xs text-gray-500">
                        Permite edição em todas as fases
                      </p>
                    </div>
                    <Switch
                      checked={config.editableInOtherStages}
                      onCheckedChange={(checked) => updateConfig({ editableInOtherStages: checked })}
                    />
                  </div>

                  {/* Valor único */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Este campo deve ter valor único</Label>
                      <p className="text-xs text-gray-500">
                        Não permite valores duplicados
                      </p>
                    </div>
                    <Switch
                      checked={config.uniqueValue}
                      onCheckedChange={(checked) => updateConfig({ uniqueValue: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="w-1/2 p-6 bg-gray-50">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Preview do campo</span>
                  </div>
                  
                  <Card className="p-4 bg-white">
                    <CardContent className="p-0">
                      <FieldPreviewRenderer 
                        field={config} 
                        showLabel={true}
                        compact={config.compactView}
                      />
                      <p className="text-xs text-blue-600 mt-3">Esta é uma prévia do seu campo</p>
                    </CardContent>
                  </Card>

                  {/* Informações adicionais */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tipo de campo:</span>
                      <Badge variant="outline">{fieldType?.label}</Badge>
                    </div>
                    
                    {config.required && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Obrigatório:</span>
                        <Badge variant="destructive" className="text-xs">Sim</Badge>
                      </div>
                    )}
                    
                    {config.editableInOtherStages && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Editável em outras fases:</span>
                        <Badge variant="secondary" className="text-xs">Sim</Badge>
                      </div>
                    )}
                    
                    {config.uniqueValue && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Valor único:</span>
                        <Badge variant="outline" className="text-xs">Sim</Badge>
                      </div>
                    )}

                    {config.compactView && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Visualização:</span>
                        <Badge variant="outline" className="text-xs">Compacta</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t bg-white">
            <div className="flex items-center justify-between">
              <Button variant="link" className="text-blue-600 p-0 h-auto">
                <Link className="w-4 h-4 mr-2" />
                Dependências do campo
              </Button>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 