import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationSettings() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Notificações</h2>
        <p className="text-muted-foreground">
          Configure suas preferências de notificação
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>E-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-lead">Novo Lead</Label>
            <Switch id="new-lead" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="task-assigned">Tarefa Atribuída</Label>
            <Switch id="task-assigned" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="opportunity-update">Atualização de Oportunidade</Label>
            <Switch id="opportunity-update" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-new-lead">Novo Lead</Label>
            <Switch id="push-new-lead" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-task-assigned">Tarefa Atribuída</Label>
            <Switch id="push-task-assigned" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-opportunity-update">
              Atualização de Oportunidade
            </Label>
            <Switch id="push-opportunity-update" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
