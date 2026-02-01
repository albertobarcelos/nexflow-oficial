import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNotificationSettings, useUpdateNotificationSettings, useUpdateStageNotifications } from '@/hooks/useNotificationSettings';
import { useQuery } from '@tanstack/react-query';
import { nexflowClient } from '@/lib/supabase';
import { getCurrentClientId } from '@/lib/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const updateStageNotifications = useUpdateStageNotifications();
  // Buscar todas as etapas de todos os flows do cliente
  const { data: allSteps = [] } = useQuery({
    queryKey: ['all-steps'],
    queryFn: async () => {
      const clientId = await getCurrentClientId();
      if (!clientId) return [];

      // Buscar todos os flows do cliente primeiro
      const { data: flows } = await nexflowClient()
        .from('flows')
        .select('id')
        .eq('client_id', clientId);

      if (!flows || flows.length === 0) return [];

      const flowIds = flows.map((f) => f.id);

      // Buscar todas as etapas dos flows
      const { data: steps, error } = await nexflowClient()
        .from('steps')
        .select('id, title, flow_id')
        .in('flow_id', flowIds)
        .order('position', { ascending: true });

      if (error) throw error;
      return steps || [];
    },
  });

  const handleToggle = async (field: 'notify_card_assigned' | 'notify_mentions' | 'email_notifications_enabled', value: boolean) => {
    try {
      await updateSettings.mutateAsync({
        [field]: value,
      });
      toast.success('Configurações atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar configurações');
    }
  };

  const handleStageToggle = async (stepId: string, checked: boolean) => {
    const currentStages = settings?.notify_new_cards_in_stages || [];
    const newStages = checked
      ? [...currentStages, stepId]
      : currentStages.filter((id) => id !== stepId);

    try {
      await updateStageNotifications.mutateAsync(newStages);
      toast.success('Configurações de etapas atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar configurações de etapas');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações de Notificações</h2>
        <p className="text-muted-foreground">
          Configure quando você deseja receber notificações
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificações Gerais</CardTitle>
          <CardDescription>
            Configure os tipos de notificações que você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="card-assigned">Cards Atribuídos</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações quando um card for atribuído a você
              </p>
            </div>
            <Switch
              id="card-assigned"
              checked={settings?.notify_card_assigned ?? true}
              onCheckedChange={(checked) => handleToggle('notify_card_assigned', checked)}
              disabled={updateSettings.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mentions">Menções</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações quando você for mencionado em uma mensagem
              </p>
            </div>
            <Switch
              id="mentions"
              checked={settings?.notify_mentions ?? true}
              onCheckedChange={(checked) => handleToggle('notify_mentions', checked)}
              disabled={updateSettings.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações por email (em breve)
              </p>
            </div>
            <Switch
              id="email"
              checked={settings?.email_notifications_enabled ?? false}
              onCheckedChange={(checked) => handleToggle('email_notifications_enabled', checked)}
              disabled={updateSettings.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações de Novos Cards</CardTitle>
          <CardDescription>
            Selecione as etapas para as quais você deseja receber notificações quando novos cards forem criados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma etapa disponível
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {allSteps.map((step) => {
                  const isChecked = settings?.notify_new_cards_in_stages?.includes(step.id) ?? false;
                  return (
                    <div key={step.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`step-${step.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleStageToggle(step.id, checked as boolean)}
                        disabled={updateStageNotifications.isPending}
                      />
                      <Label
                        htmlFor={`step-${step.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {step.title}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

