import { Globe, Shield, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FormTypeSelectorProps {
  selectedType: "public" | "internal" | null;
  onTypeSelect: (type: "public" | "internal") => void;
}

export function FormTypeSelector({ selectedType, onTypeSelect }: FormTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        TIPOS DE FORMULÁRIO
      </h2>

      <div className="space-y-3">
        {/* Formulário Público */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedType === "public"
              ? "border-orange-500 border-2 shadow-md"
              : "border"
          )}
          onClick={() => onTypeSelect("public")}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Globe className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Formulário Público</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Captação de leads via link externo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário Interno - Em desenvolvimento */}
        <Card
          className={cn(
            "cursor-not-allowed opacity-75 bg-muted/30 border-muted",
            "transition-all select-none pointer-events-none"
          )}
          aria-disabled="true"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Formulário Interno
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Uso da equipe para qualificação.
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-2 italic">
                  Em desenvolvimento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informação adicional */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Selecione o tipo de formulário para configurar as permissões e campos disponíveis.
        </p>
      </div>
    </div>
  );
}
