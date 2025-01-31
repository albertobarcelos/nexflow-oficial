import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações Gerais</h2>
        <p className="text-muted-foreground">
          Configure as preferências gerais do seu CRM
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Preferências do Sistema</CardTitle>
            <CardDescription>
              Configure as preferências básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="notifications" className="flex flex-col space-y-1">
                <span>Notificações do Sistema</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Receba notificações sobre atualizações importantes
                </span>
              </Label>
              <Switch id="notifications" />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="emails" className="flex flex-col space-y-1">
                <span>Emails de Resumo</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Receba emails diários com resumo das atividades
                </span>
              </Label>
              <Switch id="emails" />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="darkMode" className="flex flex-col space-y-1">
                <span>Modo Escuro Automático</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Alterne automaticamente entre temas claro e escuro
                </span>
              </Label>
              <Switch id="darkMode" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacidade e Segurança</CardTitle>
            <CardDescription>
              Configure suas preferências de privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="analytics" className="flex flex-col space-y-1">
                <span>Coleta de Analytics</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Permita a coleta de dados para melhorar sua experiência
                </span>
              </Label>
              <Switch id="analytics" />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="twoFactor" className="flex flex-col space-y-1">
                <span>Autenticação em Dois Fatores</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Adicione uma camada extra de segurança à sua conta
                </span>
              </Label>
              <Switch id="twoFactor" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 