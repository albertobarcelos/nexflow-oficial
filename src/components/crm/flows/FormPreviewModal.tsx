import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, 
  Eye, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  FileText,
  Save,
  AlertCircle
} from 'lucide-react';
import { useFlowBases } from '@/hooks/useFlowBases';
import { useFormFields } from '@/hooks/useFormFields';
import { FieldConfiguration } from '@/types/form-builder';

interface FormPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

export function FormPreviewModal({ 
  open, 
  onOpenChange, 
  flowId, 
  flowName 
}: FormPreviewModalProps) {
  const { linkedBases: linkedEntities, isLoading: isLoadingBases } = useFlowBases(flowId);
  const { fields: initialFields, isLoading: isLoadingFields } = useFormFields(flowId, 'initial');

  const getEntityIcon = (entityName: string) => {
    const name = entityName.toLowerCase();
    if (name.includes('empresa') || name.includes('company')) return Building2;
    if (name.includes('pessoa') || name.includes('contact') || name.includes('person')) return User;
    if (name.includes('produto') || name.includes('product')) return FileText;
    if (name.includes('parceiro') || name.includes('partner')) return User;
    if (name.includes('curso') || name.includes('course')) return FileText;
    if (name.includes('imóvel') || name.includes('imovel') || name.includes('property')) return Building2;
    return FileText;
  };

  const renderFieldPreview = (field: FieldConfiguration) => {
    const isRequired = field.required;
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder}
            disabled
            className="bg-gray-50"
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder}
            disabled
            className="bg-gray-50"
          />
        );
      
      case 'phone':
        return (
          <Input
            type="tel"
            placeholder={field.placeholder}
            disabled
            className="bg-gray-50"
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            disabled
            className="bg-gray-50"
            rows={3}
          />
        );
      
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
          </Select>
        );
      
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              R$
            </span>
            <Input
              type="number"
              placeholder="0,00"
              disabled
              className="bg-gray-50 pl-8"
            />
          </div>
        );
      
      default:
        return (
          <Input
            placeholder={field.placeholder}
            disabled
            className="bg-gray-50"
          />
        );
    }
  };

  // Calcular progresso (simulado)
  const totalFields = linkedEntities.length + initialFields.length;
  const filledFields = Math.floor(totalFields * 0.3); // 30% preenchido para demo
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview do Formulário
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Como ficará o formulário de criação para "{flowName}"
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex gap-6 h-[calc(90vh-120px)] overflow-hidden">
          {/* Sidebar Esquerda - Entidades e Campos Principais */}
          <div className="w-80 border-r border-gray-200 pr-6 space-y-6 overflow-y-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🆕 Criar Novo Deal
              </h3>
              
              {/* Barra de progresso */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progresso</span>
                  <span className="text-gray-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Título (sempre presente) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                📋 Título
                <Badge variant="destructive" className="text-xs ml-1">*</Badge>
              </Label>
              <Input
                placeholder="Digite o título do deal"
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                👥 Responsável
              </Label>
              <Select disabled>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Usuário Atual (João Silva)" />
                </SelectTrigger>
              </Select>
            </div>

            {/* Entidades Vinculadas */}
            {linkedEntities.map((flowEntity) => {
              const Icon = getEntityIcon(flowEntity.entity?.name || '');
              return (
                <div key={flowEntity.id} className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Icon className="w-4 h-4" />
                    {flowEntity.entity?.name}
                    {flowEntity.is_required && (
                      <Badge variant="destructive" className="text-xs ml-1">*</Badge>
                    )}
                    {flowEntity.is_primary && (
                      <Badge variant="default" className="text-xs ml-1 bg-blue-100 text-blue-800">
                        Principal
                      </Badge>
                    )}
                  </Label>
                  
                  <Select disabled>
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue placeholder={`Selecionar ${flowEntity.entity?.name}`} />
                    </SelectTrigger>
                  </Select>
                  
                  {flowEntity.entity?.name?.toLowerCase().includes('empresa') && (
                    <div className="ml-4 space-y-2 text-xs text-gray-500">
                      <p>• CNPJ: 12.345.678/0001-90</p>
                      <p>• Telefone: (11) 99999-9999</p>
                      <p>• Email: contato@empresa.com</p>
                    </div>
                  )}
                  
                  {flowEntity.entity?.name?.toLowerCase().includes('pessoa') && (
                    <div className="ml-4 space-y-2 text-xs text-gray-500">
                      <p>• CPF: 123.456.789-00</p>
                      <p>• Telefone: (11) 88888-8888</p>
                      <p>• Email: pessoa@email.com</p>
                    </div>
                  )}
                </div>
              );
            })}

            {linkedEntities.length === 0 && !isLoadingBases && (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma entidade vinculada</p>
                <p className="text-xs text-gray-400">
                  Configure entidades na aba anterior
                </p>
              </div>
            )}
          </div>

          {/* Área Principal - Campos Personalizados */}
          <div className="flex-1 space-y-6 overflow-y-auto">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  📋 Visão Geral
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Campos personalizados do formulário
                </p>
              </div>

              <div className="p-6 space-y-6">
                {isLoadingFields ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando campos...</p>
                  </div>
                ) : initialFields.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      Nenhum campo personalizado
                    </h4>
                    <p className="text-sm text-gray-500">
                      Adicione campos personalizados na configuração do formulário
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {initialFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-1">
                          {field.label}
                          {field.required && (
                            <Badge variant="destructive" className="text-xs ml-1">*</Badge>
                          )}
                          {field.uniqueValue && (
                            <Badge variant="outline" className="text-xs ml-1">Único</Badge>
                          )}
                        </Label>
                        {renderFieldPreview(field)}
                        {field.description && (
                          <p className="text-xs text-gray-500">{field.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Informações adicionais */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">💰 Valor</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        R$
                      </span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        disabled
                        className="bg-gray-50 pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">🏷️ Prioridade</Label>
                    <Select disabled>
                      <SelectTrigger className="bg-gray-50">
                        <SelectValue placeholder="Média" />
                      </SelectTrigger>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">📝 Observações</Label>
                  <Textarea
                    placeholder="Adicione observações sobre este deal..."
                    disabled
                    className="bg-gray-50"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Ações do formulário */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="outline" disabled>
                Salvar Rascunho
              </Button>
              <Button disabled className="bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Criar Deal
              </Button>
            </div>
          </div>
        </div>

        {/* Informações sobre o preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800">
                Este é um preview do formulário
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Sidebar esquerda:</strong> Campos principais e entidades vinculadas</p>
                <p>• <strong>Área principal:</strong> Campos personalizados em "Visão Geral"</p>
                <p>• <strong>Campos obrigatórios:</strong> Marcados com asterisco vermelho (*)</p>
                <p>• <strong>Validações:</strong> Aplicadas conforme configurado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações do modal */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar Preview
          </Button>
          <Button
            onClick={() => {
              // Aqui você poderia abrir um novo modal para testar o formulário
              alert('Funcionalidade de teste será implementada!');
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Testar Formulário
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 