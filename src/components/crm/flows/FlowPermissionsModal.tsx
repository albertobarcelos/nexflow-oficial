import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Save, Eye, EyeOff } from 'lucide-react';
import { useFlowPermissions, PermissionLevel } from '@/hooks/useFlowPermissions';
import { useFlowStages } from '@/hooks/useFlowStages';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';

interface FlowPermissionsPanelProps {
  flowId: string;
  flowName: string;
}

function FlowPermissionsPanel({ flowId, flowName }: FlowPermissionsPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<PermissionLevel>('view');
  const [stepVisibilities, setStepVisibilities] = useState<Record<string, boolean>>({});

  // Hooks
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const { stages, isLoading: isLoadingStages } = useFlowStages(flowId);
  const {
    accessControl,
    stepVisibility,
    isLoading: isLoadingPermissions,
    saveAccessControl,
    saveMultipleStepVisibility,
    isSavingAccess,
    isSavingVisibility,
  } = useFlowPermissions(flowId, selectedUserId);

  useEffect(() => {
    setSelectedUserId('');
    setSelectedPermissionLevel('view');
    setStepVisibilities({});
  }, [flowId]);

  // Carregar permissões quando usuário é selecionado
  useEffect(() => {
    if (selectedUserId && accessControl) {
      setSelectedPermissionLevel(accessControl.permission_level);
    } else if (selectedUserId && !accessControl) {
      setSelectedPermissionLevel('view');
    }
  }, [selectedUserId, accessControl]);

  // Carregar visibilidade de etapas quando usuário é selecionado
  useEffect(() => {
    if (selectedUserId && stepVisibility && stages.length > 0) {
      const visibilities: Record<string, boolean> = {};
      
      // Inicializar todas as etapas como visíveis por padrão
      stages.forEach((stage) => {
        visibilities[stage.id] = true;
      });

      // Aplicar visibilidades salvas
      stepVisibility.forEach((visibility) => {
        visibilities[visibility.step_id] = visibility.is_visible;
      });

      setStepVisibilities(visibilities);
    } else if (selectedUserId && stages.length > 0) {
      // Se não há visibilidades salvas, todas são visíveis por padrão
      const visibilities: Record<string, boolean> = {};
      stages.forEach((stage) => {
        visibilities[stage.id] = true;
      });
      setStepVisibilities(visibilities);
    }
  }, [selectedUserId, stepVisibility, stages]);

  const handleSaveGlobalPermission = () => {
    if (!selectedUserId) {
      toast.error('Selecione um usuário primeiro');
      return;
    }

    saveAccessControl({
      userId: selectedUserId,
      permissionLevel: selectedPermissionLevel,
    });
  };

  const handleSaveStepVisibility = () => {
    if (!selectedUserId) {
      toast.error('Selecione um usuário primeiro');
      return;
    }

    const visibilities = Object.entries(stepVisibilities).map(([stepId, isVisible]) => ({
      stepId,
      isVisible,
    }));

    saveMultipleStepVisibility({
      userId: selectedUserId,
      visibilities,
    });
  };

  const handleStepVisibilityChange = (stepId: string, isVisible: boolean) => {
    setStepVisibilities((prev) => ({
      ...prev,
      [stepId]: isVisible,
    }));
  };

  const isLoading = isLoadingUsers || isLoadingStages || isLoadingPermissions;
  const hasSelectedUser = !!selectedUserId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-sm font-semibold">Permissões do Flow</p>
          <p className="text-xs text-muted-foreground">{flowName}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando permissões...</p>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selecionar Usuário</CardTitle>
              <CardDescription>
                Escolha o usuário para configurar permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="user-select">Usuário</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={(value) => {
                    setSelectedUserId(value);
                    setSelectedPermissionLevel("view");
                    setStepVisibilities({});
                  }}
                >
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {hasSelectedUser && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Permissão Global do Flow</CardTitle>
                  <CardDescription>
                    Defina o nível de permissão geral para este usuário
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nível de Permissão</Label>
                    <RadioGroup
                      value={selectedPermissionLevel}
                      onValueChange={(value) =>
                        setSelectedPermissionLevel(value as PermissionLevel)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="view" id="view" />
                        <Label htmlFor="view" className="font-normal cursor-pointer">
                          Somente Leitura (view) - Pode visualizar o flow, mas não editar
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="edit" id="edit" />
                        <Label htmlFor="edit" className="font-normal cursor-pointer">
                          Edição (edit) - Pode visualizar e editar o flow
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin" className="font-normal cursor-pointer">
                          Administrador (admin) - Controle total sobre o flow
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <Button
                    onClick={handleSaveGlobalPermission}
                    disabled={isSavingAccess}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSavingAccess ? "Salvando..." : "Salvar Permissão Global"}
                  </Button>
                </CardContent>
              </Card>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Visibilidade de Etapas</CardTitle>
                  <CardDescription>
                    Marque quais etapas específicas este usuário pode visualizar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Este flow não possui etapas configuradas ainda.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {stages.map((stage) => (
                          <div
                            key={stage.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                          >
                            <Checkbox
                              id={`step-${stage.id}`}
                              checked={stepVisibilities[stage.id] ?? true}
                              onCheckedChange={(checked) =>
                                handleStepVisibilityChange(stage.id, checked === true)
                              }
                            />
                            <Label
                              htmlFor={`step-${stage.id}`}
                              className="flex-1 cursor-pointer font-normal"
                            >
                              <div className="flex items-center gap-2">
                                {stepVisibilities[stage.id] ? (
                                  <Eye className="w-4 h-4 text-green-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                                <span>{stage.name}</span>
                                <span className="text-xs text-gray-400">
                                  (Ordem: {stage.order_index})
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleSaveStepVisibility}
                        disabled={isSavingVisibility}
                        className="w-full"
                        variant="outline"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingVisibility ? "Salvando..." : "Salvar Visibilidade de Etapas"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

interface FlowPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

export function FlowPermissionsModal({
  open,
  onOpenChange,
  flowId,
  flowName,
}: FlowPermissionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissões do Flow: {flowName}</DialogTitle>
        </DialogHeader>
        <FlowPermissionsPanel flowId={flowId} flowName={flowName} />
      </DialogContent>
    </Dialog>
  );
}

export { FlowPermissionsPanel };

