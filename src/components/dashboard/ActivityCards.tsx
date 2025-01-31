import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma atividade registrada ainda.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licenças a Vencer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma licença próxima do vencimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
