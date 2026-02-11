import { useEffect, useRef, useState, useMemo } from "react";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useContactsWithIndications } from "@/hooks/useContactsWithIndications";
import { ContactCard } from "@/components/crm/contacts/ContactCard";
import { RocketLoader } from "@/components/ui/rocket-loader";
import { Loader2, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddContactDialog } from "@/components/crm/contacts/AddContactDialog";
import { AutoCreateConfigDialog } from "@/components/crm/contacts/AutoCreateConfigDialog";
import { ContactsPageHeader } from "@/components/crm/contacts/ContactsPageHeader";
import { CreateCardFromContactDialog } from "@/components/crm/contacts/CreateCardFromContactDialog";
import { ContactDetailsPanel } from "@/components/crm/contacts/ContactDetailsPanel";
import { EditContactDialog } from "@/components/crm/contacts/EditContactDialog";
import { useDeactivateContact } from "@/hooks/useDeactivateContact";
import type { UnifiedContact } from "@/hooks/useContactsWithIndications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ContactsPage() {
  const {
    hasAccess,
    accessError,
    currentClient,
    isLoading: isGuardLoading,
  } = useClientAccessGuard();
  const hasLoggedAudit = useRef(false);

  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [isAutoCreateDialogOpen, setIsAutoCreateDialogOpen] = useState(false);
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactForCard, setContactForCard] = useState<UnifiedContact | null>(
    null
  );
  const [contactToEdit, setContactToEdit] = useState<UnifiedContact | null>(
    null
  );
  const [contactToDeactivate, setContactToDeactivate] =
    useState<UnifiedContact | null>(null);
  const [filterTypes, setFilterTypes] = useState<
    ("cliente" | "parceiro" | "indicações")[]
  >([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "ativos" | "desativados" | "todos"
  >("ativos");
  const [searchQuery, setSearchQuery] = useState("");

  // Log de auditoria ao acessar a lista de contatos (uma vez por montagem quando hasAccess)
  useEffect(() => {
    if (hasAccess && currentClient?.id && !hasLoggedAudit.current) {
      console.info(
        "[AUDIT] Contatos - Client:",
        currentClient.id,
        currentClient.name ?? "",
      );
      hasLoggedAudit.current = true;
    }
  }, [hasAccess, currentClient?.id, currentClient?.name]);

  const { contacts, isLoading, isError, contactsCount, indicationsCount } =
    useContactsWithIndications({
      enabled: hasAccess,
      filterTypes: filterTypes.length > 0 ? filterTypes : undefined,
    });

  const deactivateContact = useDeactivateContact();

  const handleEditContact = (contact: UnifiedContact) => {
    if (contact.isIndication) return;
    setContactToEdit(contact);
  };

  const handleDeactivateContact = (contact: UnifiedContact) => {
    if (contact.isIndication) return;
    setContactToDeactivate(contact);
  };

  const handleConfirmDeactivate = async () => {
    if (!contactToDeactivate) return;
    const id = contactToDeactivate.id;
    try {
      await deactivateContact.mutateAsync({ contactId: id });
      if (selectedContact === id) {
        setIsDetailsPanelOpen(false);
        setSelectedContact(null);
      }
      setContactToDeactivate(null);
    } catch {
      // Erro já tratado no hook
    }
  };

  // Filtro de busca
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase().trim();

    return contacts.filter((contact) => {
      if (contact.client_name?.toLowerCase().includes(query)) return true;
      if (contact.main_contact?.toLowerCase().includes(query)) return true;
      if (
        contact.phone_numbers?.some((phone) =>
          phone.toLowerCase().includes(query),
        )
      )
        return true;
      if (
        contact.company_names?.some((company) =>
          company.toLowerCase().includes(query),
        )
      )
        return true;
      if (contact.tax_ids?.some((taxId) => taxId.toLowerCase().includes(query)))
        return true;
      return false;
    });
  }, [contacts, searchQuery]);

  // Filtro por status ativo/desativado (indicações sempre tratadas como ativas)
  const filteredByStatus = useMemo(() => {
    if (activeStatusFilter === "todos") return filteredBySearch;
    return filteredBySearch.filter((contact) => {
      if (contact.isIndication) return activeStatusFilter === "ativos";
      const isInactive = contact.is_active === false;
      if (activeStatusFilter === "ativos") return !isInactive;
      return isInactive;
    });
  }, [filteredBySearch, activeStatusFilter]);

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
          <AlertDescription>
            {accessError ??
              "Cliente não definido. Não é possível acessar os contatos."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <ContactsPageHeader
        viewMode="cards"
        onOpenAutomations={() => setIsAutoCreateDialogOpen(true)}
        onAddContact={() => setIsAddContactDialogOpen(true)}
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

      {/* Filtro por status (Ativos / Desativados / Todos) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Status:</span>
        {(["ativos", "desativados", "todos"] as const).map((status) => (
          <Button
            key={status}
            variant={activeStatusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveStatusFilter(status)}
            className="h-8"
          >
            {status === "ativos"
              ? "Ativos"
              : status === "desativados"
                ? "Desativados"
                : "Todos"}
          </Button>
        ))}
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
              {type === "indicações"
                ? "Indicações"
                : type.charAt(0).toUpperCase() + type.slice(1)}
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
            {filteredByStatus.length} de {contactsCount} contato(s) •{" "}
            {indicationsCount} indicação(ões)
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
      ) : filteredByStatus.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {filterTypes.length > 0 ||
              searchQuery.trim() ||
              activeStatusFilter !== "todos"
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
            {filteredByStatus.map((contact, index) => (
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
                onEdit={handleEditContact}
                onDeactivate={handleDeactivateContact}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialogs */}
      <AddContactDialog
        open={isAddContactDialogOpen}
        onOpenChange={setIsAddContactDialogOpen}
      />

      <AutoCreateConfigDialog
        open={isAutoCreateDialogOpen}
        onOpenChange={setIsAutoCreateDialogOpen}
      />

      <CreateCardFromContactDialog
        open={isCreateCardDialogOpen}
        onOpenChange={setIsCreateCardDialogOpen}
        contact={contactForCard}
      />

      <EditContactDialog
        open={!!contactToEdit}
        onOpenChange={(open) => !open && setContactToEdit(null)}
        contact={contactToEdit}
      />

      <AlertDialog
        open={!!contactToDeactivate}
        onOpenChange={(open) => !open && setContactToDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Desativar este contato? Ele não aparecerá na listagem de contatos
              ativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDeactivate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivateContact.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ContactDetailsPanel
        open={isDetailsPanelOpen}
        onOpenChange={setIsDetailsPanelOpen}
        contactId={selectedContact}
        onOpenEdit={() => {
          const c = selectedContact
            ? contacts.find((c) => c.id === selectedContact) ?? null
            : null;
          setContactToEdit(c);
        }}
        onDeactivate={() => {
          const c = selectedContact
            ? contacts.find((c) => c.id === selectedContact) ?? null
            : null;
          setContactToDeactivate(c);
        }}
      />
    </div>
  );
}
