import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  User,
  Calendar,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  CreditCard,
  Building2,
} from "lucide-react";
import { useIndicationDetails } from "@/hooks/useIndicationDetails";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";

interface IndicationDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicationId: string | null;
}

export function IndicationDetailsPanel({
  open,
  onOpenChange,
  indicationId,
}: IndicationDetailsPanelProps) {
  const { data: details, isLoading } = useIndicationDetails(indicationId);
  const navigate = useNavigate();

  if (!indicationId) {
    return null;
  }

  const handleCardClick = (flowId: string, cardId: string) => {
    navigate(`/crm/flows/${flowId}/board`);
    // Scroll to card could be implemented later
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes da Indicação</DialogTitle>
          <DialogDescription>
            Informações completas e histórico de interações
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !details ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Indicação não encontrada
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Header com nome */}
              <div className="flex items-start gap-4">
                <UserAvatar
                  user={{
                    avatar_type: "toy_face",
                    avatar_seed: "1|1",
                    name: details.indication_name || "Indicação",
                  }}
                  size="lg"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {details.indication_name || "Indicação sem nome"}
                  </h2>
                  {details.responsible && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Responsável: {details.responsible}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Informações principais */}
              <div className="grid grid-cols-2 gap-4">
                {details.cnpj_cpf && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="h-4 w-4" />
                      CNPJ/CPF
                    </div>
                    <p className="text-sm">{details.cnpj_cpf}</p>
                  </div>
                )}

                {details.phone && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </div>
                    <p className="text-sm font-mono">{details.phone}</p>
                  </div>
                )}
              </div>

              {details.description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Descrição
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {details.description}
                    </p>
                  </div>
                </>
              )}

              {/* Informações do Hunter */}
              {details.hunter && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      Indicado por
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {details.hunter.name || details.hunter.email || "Hunter desconhecido"}
                      </p>
                      {details.hunter.email && (
                        <span className="text-xs text-muted-foreground">
                          ({details.hunter.email})
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Cards vinculados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Cards Vinculados</h3>
                  <Badge variant="secondary">
                    {details.linkedCards.length}
                  </Badge>
                </div>
                {details.linkedCards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum card vinculado a esta indicação
                  </p>
                ) : (
                  <div className="space-y-2">
                    {details.linkedCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleCardClick(card.flowId, card.id)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{card.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Flow: {card.flowId.slice(0, 8)}...
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Histórico de interações */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <h3 className="font-semibold">Histórico</h3>
                </div>
                {details.interactionHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum histórico disponível
                  </p>
                ) : (
                  <div className="space-y-3">
                    {details.interactionHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="mt-0.5">
                          {item.type === "created" ? (
                            <FileText className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(item.createdAt),
                              "dd 'de' MMM 'de' yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações adicionais */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criado em{" "}
                    {format(
                      new Date(details.created_at),
                      "dd 'de' MMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                {details.status && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        details.status === "converted"
                          ? "default"
                          : details.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {details.status === "pending"
                        ? "Pendente"
                        : details.status === "processed"
                        ? "Processado"
                        : details.status === "converted"
                        ? "Convertido"
                        : "Rejeitado"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

