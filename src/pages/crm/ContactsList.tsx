import { useEffect, useRef, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useClientAccessGuard } from '@/hooks/useClientAccessGuard';
import { useContactsWithIndications } from '@/hooks/useContactsWithIndications';
import { ContactDetailsPanel } from '@/components/crm/contacts/ContactDetailsPanel';
import { CreateCardFromContactDialog } from '@/components/crm/contacts/CreateCardFromContactDialog';
import { AutoCreateConfigDialog } from '@/components/crm/contacts/AutoCreateConfigDialog';
import { ContactsPageHeader } from '@/components/crm/contacts/ContactsPageHeader';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, Filter, Tag, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ContactsList() {
  const { toast } = useToast();
  const { hasAccess, accessError, currentClient, isLoading: isGuardLoading } = useClientAccessGuard();
  const hasLoggedAudit = useRef(false);

  const [filterTypes, setFilterTypes] = useState<("cliente" | "parceiro" | "indicações")[]>([]);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactForCard, setContactForCard] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAutoCreateDialogOpen, setIsAutoCreateDialogOpen] = useState(false);
  const pageSize = 20;

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

  // Calcular paginação
  const totalPages = useMemo(() => Math.ceil(filteredBySearch.length / pageSize), [filteredBySearch.length, pageSize]);
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredBySearch.slice(startIndex, endIndex);
  }, [filteredBySearch, currentPage, pageSize]);

  // Resetar página quando filtros ou busca mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTypes, searchQuery]);

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
      description:
        "A funcionalidade de adicionar novo contato estará disponível em breve.",
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <ContactsPageHeader
        viewMode="list"
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

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato Principal</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Telefones</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.map((contact) => {
                  const typeLabels: Record<"cliente" | "parceiro" | "outro", string> = {
                    cliente: "Cliente",
                    parceiro: "Parceiro",
                    outro: "Outro",
                  };
                  
                  const typeColors: Record<"cliente" | "parceiro" | "outro", string> = {
                    cliente: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
                    parceiro: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
                    outro: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
                  };

                  const handleRowClick = () => {
                    // Não abrir detalhes para indicações
                    if (!contact.isIndication) {
                      setSelectedContact(contact.id);
                      setIsDetailsPanelOpen(true);
                    }
                  };

                  const handleCreateCard = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setContactForCard(contact);
                  };

                  return (
                    <TableRow
                      key={contact.id}
                      className={cn(
                        "hover:bg-muted",
                        !contact.isIndication && "cursor-pointer"
                      )}
                      onClick={handleRowClick}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            user={{
                              avatar_type: contact.avatar_type || "toy_face",
                              avatar_seed: contact.avatar_seed || "1|1",
                              name: contact.client_name,
                            }}
                            size="sm"
                          />
                          <span className="font-medium">
                            {contact.client_name || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{contact.main_contact || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {/* Badge de Indicação */}
                          {contact.isIndication && (
                            <Badge 
                              variant="outline" 
                              className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              Indicação
                            </Badge>
                          )}
                          {/* Badges de tipo de contato */}
                          {contact.contact_type && (() => {
                            const types = Array.isArray(contact.contact_type) 
                              ? contact.contact_type 
                              : [contact.contact_type];
                            
                            return types.map((type) => {
                              if (!type || !typeLabels[type as keyof typeof typeLabels]) return null;
                              return (
                                <Badge
                                  key={type}
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    typeColors[type as keyof typeof typeColors]
                                  )}
                                >
                                  {typeLabels[type as keyof typeof typeLabels]}
                                </Badge>
                              );
                            });
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.phone_numbers && contact.phone_numbers.length > 0
                          ? contact.phone_numbers.slice(0, 2).join(', ') + 
                            (contact.phone_numbers.length > 2 ? ` (+${contact.phone_numbers.length - 2})` : '')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {contact.company_names && contact.company_names.length > 0
                          ? contact.company_names.slice(0, 2).join(', ') + 
                            (contact.company_names.length > 2 ? ` (+${contact.company_names.length - 2})` : '')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {contact.assigned_team_id ? (
                          <Badge variant="outline">Time ID: {contact.assigned_team_id.slice(0, 8)}...</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.created_at
                          ? new Date(contact.created_at).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreateCard}
                          className="h-8 px-3 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Criar Card
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Math.max(1, currentPage - 1));
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {(() => {
                  const pages: (number | "ellipsis")[] = [];
                  const showEllipsis = totalPages > 7;

                  if (!showEllipsis) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push(1);

                    if (currentPage <= 4) {
                      for (let i = 2; i <= 5; i++) {
                        pages.push(i);
                      }
                      pages.push("ellipsis");
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push("ellipsis");
                      for (let i = totalPages - 4; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      pages.push("ellipsis");
                      pages.push(currentPage - 1);
                      pages.push(currentPage);
                      pages.push(currentPage + 1);
                      pages.push("ellipsis");
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === "ellipsis") {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Math.min(totalPages, currentPage + 1));
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Dialogs */}
      <AutoCreateConfigDialog
        open={isAutoCreateDialogOpen}
        onOpenChange={setIsAutoCreateDialogOpen}
      />

      <ContactDetailsPanel
        open={isDetailsPanelOpen}
        onOpenChange={setIsDetailsPanelOpen}
        contactId={selectedContact}
      />

      <CreateCardFromContactDialog
        open={!!contactForCard}
        onOpenChange={(open) => {
          if (!open) setContactForCard(null);
        }}
        contact={contactForCard}
      />
    </div>
  );
}
