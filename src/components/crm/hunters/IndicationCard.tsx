import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Indication, IndicationStatus } from "@/types/indications";
import { Calendar, User, Phone, FileText, Link2, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IndicationCardProps {
  indication: Indication;
}

const statusLabels: Record<IndicationStatus, string> = {
  pending: "Pendente",
  processed: "Processado",
  converted: "Convertido",
  rejected: "Rejeitado",
};

const statusColors: Record<IndicationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processed: "bg-blue-100 text-blue-800 border-blue-200",
  converted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export function IndicationCard({ indication }: IndicationCardProps) {
  const hunter = indication.hunter;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {indication.indication_name || "Indicação sem nome"}
            </CardTitle>
            {indication.cnpj_cpf && (
              <CardDescription className="mt-1 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span>{indication.cnpj_cpf}</span>
              </CardDescription>
            )}
          </div>
          <Badge className={statusColors[indication.status]}>
            {statusLabels[indication.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações de contato */}
        <div className="space-y-2">
          {indication.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{indication.phone}</span>
            </div>
          )}
        </div>

        {/* Descrição */}
        {indication.description && (
          <div className="space-y-1">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <span className="font-medium text-muted-foreground">Descrição: </span>
                <span>{indication.description}</span>
              </div>
            </div>
          </div>
        )}

        {/* Responsável */}
        {indication.responsible && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              Responsável: {indication.responsible}
            </span>
          </div>
        )}

        {/* Informações do Hunter */}
        {hunter && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <User className="h-4 w-4" />
            <span>
              Indicado por: {hunter.name || hunter.email || "Hunter desconhecido"}
            </span>
          </div>
        )}

        {/* Cards relacionados */}
        {indication.related_card_ids && indication.related_card_ids.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Link2 className="h-4 w-4" />
            <span>
              {indication.related_card_ids.length} card(s) relacionado(s)
            </span>
          </div>
        )}

        {/* Data de criação */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>
            Criado em {format(new Date(indication.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

