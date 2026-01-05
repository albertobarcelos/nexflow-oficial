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
  Building2,
  User,
  Calendar,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { useContactDetails } from "@/hooks/useContactDetails";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ContactDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
}

export function ContactDetailsPanel({
  open,
  onOpenChange,
  contactId,
}: ContactDetailsPanelProps) {
  const { data: details, isLoading } = useContactDetails(contactId);
  const navigate = useNavigate();

  if (!contactId) {
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
          <DialogTitle>Detalhes da Oportunidade</DialogTitle>
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
            Oportunidade não encontrada
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Header com avatar e nome */}
              <div className="flex items-start gap-4">
                <UserAvatar
                  user={{
                    avatar_type: details.avatar_type || "toy_face",
                    avatar_seed: details.avatar_seed || "1|1",
                    name: details.client_name,
                  }}
                  size="lg"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{details.client_name}</h2>
                  {details.main_contact && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{details.main_contact}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Informações principais */}
              <div className="grid grid-cols-2 gap-4">
                {details.company_names && details.company_names.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4" />
                      Empresas
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {details.company_names.map((company, idx) => (
                        <Badge key={idx} variant="secondary">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {details.phone_numbers && details.phone_numbers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" />
                      Telefones
                    </div>
                    <div className="flex flex-col gap-1">
                      {details.phone_numbers.map((phone, idx) => (
                        <span key={idx} className="text-sm font-mono">
                          {phone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                    Nenhum card vinculado a esta oportunidade
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
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}




