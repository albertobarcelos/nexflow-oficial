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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Building2,
  User,
  Calendar,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  Info,
  Briefcase,
  History,
} from "lucide-react";
import { useContactDetails } from "@/hooks/useContactDetails";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ContactCompaniesTab } from "./ContactCompaniesTab";
import { ContactIndicatedBySelect } from "./ContactIndicatedBySelect";
import { ContactTimeline } from "./ContactTimeline";
import { nexflowClient, getCurrentClientId } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();

  const updateContactType = useMutation({
    mutationFn: async (contactType: "cliente" | "parceiro" | "outro") => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      const { error } = await nexflowClient()
        .from("contacts")
        .update({ contact_type: contactType })
        .eq("id", contactId)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-details", contactId] });
      toast.success("Tipo de contato atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar tipo de contato:", error);
      toast.error(error.message || "Erro ao atualizar tipo de contato");
    },
  });

  if (!contactId) {
    return null;
  }

  const handleCardClick = (flowId: string, cardId: string) => {
    navigate(`/crm/flows/${flowId}/board`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes do Contato</DialogTitle>
          <DialogDescription>
            Informações completas, empresas vinculadas e histórico
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !details ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Contato não encontrado
          </div>
        ) : (
          <Tabs defaultValue="informacoes" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="informacoes" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="empresas" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Empresas
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-4 mt-4">
              <TabsContent value="informacoes" className="space-y-6 mt-0">
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
                    {details.phone_numbers && details.phone_numbers.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{details.phone_numbers[0]}</span>
                        {details.phone_numbers.length > 1 && (
                          <span className="text-xs">(+{details.phone_numbers.length - 1} mais)</span>
                        )}
                      </div>
                    )}
                    {details.main_contact && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{details.main_contact}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Tipo de Contato */}
                <div className="space-y-2">
                  <Label htmlFor="contact-type">Tipo de Contato</Label>
                  <Select
                    value={details.contact_type || "cliente"}
                    onValueChange={(value: "cliente" | "parceiro" | "outro") =>
                      updateContactType.mutate(value)
                    }
                    disabled={updateContactType.isPending}
                  >
                    <SelectTrigger id="contact-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="parceiro">Parceiro</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Parceiro Indicador */}
                <ContactIndicatedBySelect
                  contactId={contactId}
                  currentIndicatedBy={details.indicated_by}
                />

                <Separator />

                {/* Informações principais */}
                <div className="grid grid-cols-2 gap-4">
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

                  {details.companies && details.companies.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4" />
                        Empresas Vinculadas
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {details.companies.map((company, idx) => (
                          <Badge key={idx} variant="secondary">
                            {company.company?.name || "Empresa"}
                            {company.is_primary && (
                              <span className="ml-1 text-xs">(Principal)</span>
                            )}
                          </Badge>
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
                    <Badge variant="secondary">{details.linkedCards.length}</Badge>
                  </div>
                  {details.linkedCards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum card vinculado a este contato
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
              </TabsContent>

              <TabsContent value="empresas" className="mt-0">
                <ContactCompaniesTab contactId={contactId} />
              </TabsContent>

              <TabsContent value="historico" className="mt-0">
                <ContactTimeline contactId={contactId} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
