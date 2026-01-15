import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações Gerais</h2>
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
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="theme">Tema Escuro</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isDark ? "Tema escuro ativado" : "Tema claro ativado"}
              </p>
            </div>
            <Switch 
              id="theme" 
              checked={isDark}
              onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light");
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 