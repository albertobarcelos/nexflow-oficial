import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/useNotificationSettings';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function NotificationSettings() {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('soundEffectsEnabled');
    if (saved !== null) {
      setSoundEffectsEnabled(saved === 'true');
    }
  }, []);

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

  const handleSoundEffectsToggle = (checked: boolean) => {
    setSoundEffectsEnabled(checked);
    localStorage.setItem('soundEffectsEnabled', String(checked));
    toast.success(checked ? 'Efeitos sonoros ativados' : 'Efeitos sonoros desativados');
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
        <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
        <p className="text-muted-foreground">
          Configure suas preferências de notificação
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificações do Sistema</CardTitle>
          <CardDescription>
            Configure quando você deseja receber notificações
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
                Receba notificações por email
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
          <CardTitle>Efeitos Sonoros</CardTitle>
          <CardDescription>
            Configure os efeitos sonoros do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-effects">Efeitos Sonoros</Label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative os efeitos sonoros das notificações
              </p>
            </div>
            <Switch
              id="sound-effects"
              checked={soundEffectsEnabled}
              onCheckedChange={handleSoundEffectsToggle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
