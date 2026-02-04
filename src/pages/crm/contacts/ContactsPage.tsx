import { useEffect, useRef, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useContactsWithIndications } from "@/hooks/useContactsWithIndications";
import { ContactCard } from "@/components/crm/contacts/ContactCard";
import { RocketLoader } from "@/components/ui/rocket-loader";
import { Loader2, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoCreateConfigDialog } from "@/components/crm/contacts/AutoCreateConfigDialog";
import { ContactsPageHeader } from "@/components/crm/contacts/ContactsPageHeader";
import { CreateCardFromContactDialog } from "@/components/crm/contacts/CreateCardFromContactDialog";
import { ContactDetailsPanel } from "@/components/crm/contacts/ContactDetailsPanel";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function ContactsPage() {
  const { toast } = useToast();
  const { hasAccess, accessError, currentClient, isLoading: isGuardLoading } = useClientAccessGuard();
  const hasLoggedAudit = useRef(false);

  const [isAutoCreateDialogOpen, setIsAutoCreateDialogOpen] = useState(false);
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactForCard, setContactForCard] = useState<any>(null);
  const [filterTypes, setFilterTypes] = useState<("cliente" | "parceiro" | "indicações")[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Log de auditoria ao acessar a lista de contatos (uma vez por montagem quando hasAccess)
  useEffect(() => {
    if (hasAccess && currentClient?.id && !hasLoggedAudit.current) {
      console.info("[AUDIT] Contatos - Client:", currentClient.id, currentClient.name ?? "");
      hasLoggedAudit.current = true;
    }
  }, [hasAccess, currentClient?.id, currentClient?.name]);

  const {
    contacts,
    isLoading,
    isError,
    contactsCount,
    indicationsCount,
  } = useContactsWithIndications({
    enabled: hasAccess,
    filterTypes: filterTypes.length > 0 ? filterTypes : undefined,
  });

  // Filtro de busca
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    return contacts.filter((contact) => {
      // Buscar em client_name
      if (contact.client_name?.toLowerCase().includes(query)) return true;
      
      // Buscar em main_contact
      if (contact.main_contact?.toLowerCase().includes(query)) return true;
      
      // Buscar em phone_numbers
      if (contact.phone_numbers?.some(phone => phone.toLowerCase().includes(query))) return true;
      
      // Buscar em company_names
      if (contact.company_names?.some(company => company.toLowerCase().includes(query))) return true;
      
      // Buscar em tax_ids (CNPJ/CPF)
      if (contact.tax_ids?.some(taxId => taxId.toLowerCase().includes(query))) return true;
      
      return false;
    });
  }, [contacts, searchQuery]);

  if (isGuardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertDescription>{accessError ?? "Cliente não definido. Não é possível acessar os contatos."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddContact = () => {
    toast({
      title: "Em breve",
      description: "A funcionalidade de adicionar novo contato estará disponível em breve.",
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <ContactsPageHeader
        viewMode="cards"
        onOpenAutomations={() => setIsAutoCreateDialogOpen(true)}
        onAddContact={handleAddContact}
      />

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtros por tipo */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filtros:</span>
        {(["cliente", "parceiro", "indicações"] as const).map((type) => {
          const isActive = filterTypes.includes(type);
          return (
            <Button
              key={type}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (isActive) {
                  setFilterTypes(filterTypes.filter((t) => t !== type));
                } else {
                  setFilterTypes([...filterTypes, type]);
                }
              }}
              className="h-8"
            >
              {type === "indicações" ? "Indicações" : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          );
        })}
        {filterTypes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterTypes([])}
            className="h-8 text-xs"
          >
            Limpar filtros
          </Button>
        )}
        {(contactsCount > 0 || indicationsCount > 0) && (
          <span className="text-xs text-muted-foreground ml-auto">
            {contactsCount} contato(s) • {indicationsCount} indicação(ões)
          </span>
        )}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <RocketLoader />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-sm text-destructive">
              Erro ao carregar contatos. Tente novamente.
            </p>
          </div>
        </div>
      ) : filteredBySearch.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {filterTypes.length > 0 || searchQuery.trim()
                ? "Nenhum contato encontrado com os filtros selecionados."
                : "Nenhum contato encontrado."}
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filteredBySearch.map((contact, index) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={index}
                onClick={() => {
                  // Não abrir detalhes para indicações ainda (pode ser implementado depois)
                  if (!contact.isIndication) {
                    setSelectedContact(contact.id);
                    setIsDetailsPanelOpen(true);
                  }
                }}
                onCreateCard={() => {
                  setContactForCard(contact);
                  setIsCreateCardDialogOpen(true);
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialogs */}
      <AutoCreateConfigDialog
        open={isAutoCreateDialogOpen}
        onOpenChange={setIsAutoCreateDialogOpen}
      />

      <CreateCardFromContactDialog
        open={isCreateCardDialogOpen}
        onOpenChange={setIsCreateCardDialogOpen}
        contact={contactForCard}
      />

      <ContactDetailsPanel
        open={isDetailsPanelOpen}
        onOpenChange={setIsDetailsPanelOpen}
        contactId={selectedContact}
      />
    </div>
  );
}
