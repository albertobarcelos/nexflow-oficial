import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações Gerais</h2>
        <p className="text-muted-foreground">
          Configure as preferências básicas do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferências do Sistema</CardTitle>
            <CardDescription>
              Configure as preferências gerais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Notificações do Sistema</Label>
              <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-summary">Resumo por E-mail</Label>
              <Switch id="email-summary" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <Switch id="dark-mode" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacidade</CardTitle>
            <CardDescription>
              Configure suas preferências de privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics">Coleta de Analytics</Label>
              <Switch id="analytics" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa">Autenticação em Dois Fatores</Label>
              <Switch id="2fa" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 