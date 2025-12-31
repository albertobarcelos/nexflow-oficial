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

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Personalize a aparência do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme">Tema</Label>
              <p className="text-sm text-muted-foreground">
                Escolha entre tema claro ou escuro
              </p>
            </div>
            <Switch id="theme" disabled />
          </div>
          <p className="text-xs text-muted-foreground italic">
            A troca de tema será implementada em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 