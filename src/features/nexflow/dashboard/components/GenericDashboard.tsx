import { Card, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenericDashboardProps {
  className?: string;
}

/**
 * Placeholder para flows com categoria genérica.
 * Dashboard completo disponível apenas para Vendas (finance) e Onboarding.
 */
export function GenericDashboard({ className }: GenericDashboardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground max-w-sm">
          Dashboard disponível para flows de <strong>Vendas</strong> ou{" "}
          <strong>Onboarding</strong>. Altere a categoria do flow nas
          configurações para ver métricas específicas.
        </p>
      </CardContent>
    </Card>
  );
}
