import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { AutomationBuilder } from "./AutomationBuilder";
import { useState } from "react";

export function AutomationSettings() {
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automações</h2>
          <p className="text-muted-foreground">
            Configure automações para otimizar seu fluxo de trabalho
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Automação
        </Button>
      </div>

      {showBuilder && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Automação</CardTitle>
            <CardDescription>
              Configure as condições e ações para sua automação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationBuilder onClose={() => setShowBuilder(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Automático</CardTitle>
            <CardDescription>
              Envia e-mail após 7 dias sem atualização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quando um lead não é atualizado por 7 dias, envia automaticamente um
              e-mail de follow-up.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atribuição de Lead</CardTitle>
            <CardDescription>
              Distribui leads automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Atribui novos leads automaticamente com base na região e
              disponibilidade da equipe.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}