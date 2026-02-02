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
import { Checkbox } from "@/components/ui/checkbox";
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
    mutationFn: async (contactTypes: ("cliente" | "parceiro")[]) => {
      if (!contactId) throw new Error("Contact ID é obrigatório");

      const clientId = await getCurrentClientId();
      if (!clientId) {
        throw new Error("Não foi possível identificar o tenant atual.");
      }

      // Salvar como array (pode ser vazio/null)
      const contactTypeValue: ("cliente" | "parceiro")[] | null = 
        contactTypes.length > 0 ? contactTypes : null;

      const { error } = await nexflowClient()
        .from("contacts")
        .update({ contact_type: contactTypeValue } as any)
        .eq("id", contactId as any)
        .eq("client_id", clientId as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-details", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Tipo de contato atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar tipo de contato:", error);
      toast.error(error.message || "Erro ao atualizar tipo de contato");
    },
  });

  const handleTypeToggle = (type: "cliente" | "parceiro") => {
    // Suporta tanto string quanto array para compatibilidade
    const currentTypes: ("cliente" | "parceiro")[] = Array.isArray(details?.contact_type) 
      ? (details.contact_type.filter((t): t is "cliente" | "parceiro" => 
          t === "cliente" || t === "parceiro")) as ("cliente" | "parceiro")[]
      : details?.contact_type && (details.contact_type === "cliente" || details.contact_type === "parceiro")
        ? [details.contact_type as "cliente" | "parceiro"]
        : [];
    
    const newTypes: ("cliente" | "parceiro")[] = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    updateContactType.mutate(newTypes);
  };

  if (!contactId) {
    return null;
  }

  const handleCardClick = (flowId: string, cardId: string) => {
    navigate(`/crm/flows/${flowId}/board`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Detalhes do Contato</DialogTitle>
          <DialogDescription>
            Informações completas, empresas vinculadas e histórico
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !details ? (
          <div className="text-center py-12 text-sm text-muted-foreground px-6">
            Contato não encontrado
          </div>
        ) : (
          <Tabs defaultValue="informacoes" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 mx-6 mb-0">
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

            <div className="flex-1 min-h-0 overflow-hidden px-6 pb-6">
              <ScrollArea className="h-full">
                <div className="pr-4">
                <TabsContent value="informacoes" forceMount className="space-y-6 mt-4 data-[state=inactive]:hidden">
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

                {/* Tipo de Contato - Seleção Múltipla */}
                <div className="space-y-3">
                  <Label>Tipo de Contato</Label>
                  <div className="space-y-2">
                    {(["cliente", "parceiro"] as const).map((type) => {
                      // Suporta tanto string quanto array para compatibilidade
                      const contactTypes: ("cliente" | "parceiro")[] = Array.isArray(details.contact_type) 
                        ? (details.contact_type.filter((t): t is "cliente" | "parceiro" => 
            t === "cliente" || t === "parceiro")) as ("cliente" | "parceiro")[]
                        : details?.contact_type && (details.contact_type === "cliente" || details.contact_type === "parceiro")
                          ? [details.contact_type as "cliente" | "parceiro"]
                          : [];
                      const isChecked = contactTypes.includes(type);
                      return (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`contact-type-${type}`}
                            checked={isChecked}
                            onCheckedChange={() => handleTypeToggle(type)}
                            disabled={updateContactType.isPending}
                          />
                          <label
                            htmlFor={`contact-type-${type}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {type === "cliente" ? "Cliente" : "Parceiro"}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {/* Exibir tipos selecionados como tags */}
                  {details.contact_type && (() => {
                    const contactTypes: ("cliente" | "parceiro")[] = Array.isArray(details.contact_type) 
                      ? (details.contact_type.filter((t): t is "cliente" | "parceiro" => 
                          t === "cliente" || t === "parceiro")) as ("cliente" | "parceiro")[]
                      : details.contact_type && (details.contact_type === "cliente" || details.contact_type === "parceiro")
                        ? [details.contact_type as "cliente" | "parceiro"]
                        : [];
                    return contactTypes.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contactTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className={
                              type === "cliente"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            }
                          >
                            {type === "cliente" ? "Cliente" : "Parceiro"}
                          </Badge>
                        ))}
                      </div>
                    ) : null;
                  })()}
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

                  {details.company_names && details.company_names.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-4 w-4" />
                        Empresas Vinculadas
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {details.company_names.map((companyName, idx) => (
                          <Badge key={idx} variant="secondary">
                            {companyName}
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

                <TabsContent value="empresas" forceMount className="mt-4 data-[state=inactive]:hidden">
                  <ContactCompaniesTab contactId={contactId} />
                </TabsContent>

                <TabsContent value="historico" forceMount className="mt-4 data-[state=inactive]:hidden">
                  <ContactTimeline contactId={contactId} />
                </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
