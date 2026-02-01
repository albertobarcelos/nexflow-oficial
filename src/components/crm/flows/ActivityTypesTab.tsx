import { useState } from 'react';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useFlowActivityTypes, useCreateFlowActivityType, useUpdateFlowActivityType, useDeleteFlowActivityType } from '@/hooks/useFlowActivityTypes';
import { toast } from 'sonner';
import type { FlowActivityType, CreateFlowActivityTypeInput, UpdateFlowActivityTypeInput } from '@/types/activities';

// Lista de ícones do lucide-react mais comuns
const LUCIDE_ICONS = [
  'Calendar',
  'Clock',
  'Phone',
  'Mail',
  'MessageSquare',
  'Video',
  'Users',
  'User',
  'MapPin',
  'FileText',
  'CheckCircle',
  'AlertCircle',
  'Star',
  'Heart',
  'Briefcase',
  'Home',
  'Building',
  'Car',
  'Plane',
  'ShoppingCart',
];

interface ActivityTypesTabProps {
  flowId: string;
}

export function ActivityTypesTab({ flowId }: ActivityTypesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<FlowActivityType | null>(null);
  const [formData, setFormData] = useState<CreateFlowActivityTypeInput>({
    flow_id: flowId,
    name: '',
    color: '#3B82F6',
    icon: 'Calendar',
    active: true,
  });

  const { data: activityTypes = [], isLoading } = useFlowActivityTypes(flowId);
  const createType = useCreateFlowActivityType();
  const updateType = useUpdateFlowActivityType();
  const deleteType = useDeleteFlowActivityType();

  const handleOpenDialog = (type?: FlowActivityType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        flow_id: flowId,
        name: type.name,
        color: type.color || '#3B82F6',
        icon: type.icon || 'Calendar',
        active: type.active,
      });
    } else {
      setEditingType(null);
      setFormData({
        flow_id: flowId,
        name: '',
        color: '#3B82F6',
        icon: 'Calendar',
        active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    setFormData({
      flow_id: flowId,
      name: '',
      color: '#3B82F6',
      icon: 'Calendar',
      active: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome do tipo de atividade é obrigatório');
      return;
    }

    try {
      if (editingType) {
        const updateInput: UpdateFlowActivityTypeInput = {
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          active: formData.active,
        };
        await updateType.mutateAsync({
          id: editingType.id,
          flowId,
          input: updateInput,
        });
      } else {
        await createType.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('[ActivityTypesTab] Erro ao salvar:', error);
    }
  };

  const handleDelete = async (type: FlowActivityType) => {
    if (!window.confirm(`Tem certeza que deseja deletar o tipo "${type.name}"?`)) {
      return;
    }

    try {
      await deleteType.mutateAsync({
        id: type.id,
        flowId,
      });
    } catch (error) {
      console.error('[ActivityTypesTab] Erro ao deletar:', error);
    }
  };

  const handleToggleActive = async (type: FlowActivityType) => {
    try {
      await updateType.mutateAsync({
        id: type.id,
        flowId,
        input: { active: !type.active },
      });
    } catch (error) {
      console.error('[ActivityTypesTab] Erro ao atualizar:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Carregando tipos de atividade...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Atividade</h3>
          <p className="text-sm text-muted-foreground">
            Configure os tipos de atividade disponíveis para este flow
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {activityTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            Nenhum tipo de atividade configurado
          </p>
          <Button variant="outline" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Tipo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activityTypes.map((type) => (
            <div
              key={type.id}
              className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: type.color || '#3B82F6' }}
                  />
                  <h4 className="font-semibold">{type.name}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(type)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Ícone:</span>
                  <Badge variant="outline">{type.icon || 'N/A'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={type.active}
                    onCheckedChange={() => handleToggleActive(type)}
                  />
                  <span className={type.active ? 'text-green-600' : 'text-gray-400'}>
                    {type.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Editar Tipo de Atividade' : 'Novo Tipo de Atividade'}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? 'Atualize as informações do tipo de atividade'
                : 'Configure um novo tipo de atividade para este flow'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Reunião, Visita, Ticket"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, icon: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {LUCIDE_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                      setFormData((prev) => ({ ...prev, color: value || '#3B82F6' }));
                    }
                  }}
                  className="flex-1 font-mono"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Ativo</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, active: checked }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                <Check className="mr-2 h-4 w-4" />
                {editingType ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
