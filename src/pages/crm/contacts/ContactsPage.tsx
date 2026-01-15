import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useContactsWithIndications } from "@/hooks/useContactsWithIndications";
import { ContactCard } from "@/components/crm/contacts/ContactCard";
import { RocketLoader } from "@/components/ui/rocket-loader";
import { Loader2, Settings, Plus, List, Filter, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoCreateConfigDialog } from "@/components/crm/contacts/AutoCreateConfigDialog";
import { CreateCardFromContactDialog } from "@/components/crm/contacts/CreateCardFromContactDialog";
import { ContactDetailsPanel } from "@/components/crm/contacts/ContactDetailsPanel";
import { GenerateFormDialog } from "@/components/crm/contacts/GenerateFormDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Fix: Use sessionStorage to persist hasAccess across remounts
  const [hasAccess, setHasAccess] = useState(() => {
    const stored = sessionStorage.getItem('contacts-page-has-access');
    const hasAccessValue = stored === 'true';
    return hasAccessValue;
  });
  const [isCheckingAccess, setIsCheckingAccess] = useState(!hasAccess);
  const [isAutoCreateDialogOpen, setIsAutoCreateDialogOpen] = useState(false);
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isGenerateFormDialogOpen, setIsGenerateFormDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactForCard, setContactForCard] = useState<any>(null);
  const [filterTypes, setFilterTypes] = useState<("cliente" | "parceiro" | "indicações")[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
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

  useEffect(() => {
    // #region agent log - Fix: Skip check if we already have access
    if (hasAccess) {
      setIsCheckingAccess(false);
      return;
    }
    // #endregion
    
    const checkAccess = async () => {
      try {
        // 1. Verificar autenticação
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/crm/login");
          return;
        }

        const userId = session.user.id;

        // 2. Verificar role do usuário
        const { data: clientUser, error: userError } = await supabase
          .from('core_client_users')
          .select('role, client_id')
          .eq('id', userId)
          .single();

        if (userError || !clientUser) {
          console.error('Erro ao buscar usuário:', userError);
          toast({
            title: "Erro de acesso",
            description: "Não foi possível verificar suas permissões.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        // Verificar se é administrator
        let hasRoleAccess = clientUser.role === 'administrator';

        // Se não for administrator, verificar se é leader de time
        if (!hasRoleAccess) {
          const { data: teamMembers, error: teamError } = await (supabase as any)
            .from('core_team_members')
            .select('role')
            .eq('user_profile_id', userId)
            .eq('role', 'leader');

          if (!teamError && teamMembers && teamMembers.length > 0) {
            hasRoleAccess = true;
          }
        }

        if (!hasRoleAccess) {
          toast({
            title: "Acesso negado",
            description: "Apenas administrators e leaders de time podem acessar esta página.",
            variant: "destructive",
          });
          navigate("/crm/dashboard");
          return;
        }

        // Todas as validações passaram
        setHasAccess(true);
        // #region agent log - Fix: Persist hasAccess in sessionStorage
        sessionStorage.setItem('contacts-page-has-access', 'true');
        // #endregion
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar seu acesso.",
          variant: "destructive",
        });
        navigate("/crm/dashboard");
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [navigate, toast]);

  if (isCheckingAccess) {
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
    return null; // O redirecionamento já foi feito no useEffect
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Visualize e gerencie os contatos de clientes e indicações
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/crm/contacts/list')}
          >
            <List className="mr-2 h-4 w-4" />
            Visualizar Lista
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsGenerateFormDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Gerar Formulário
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAutoCreateDialogOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Automações
          </Button>
        </div>
      </div>

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
      <GenerateFormDialog
        open={isGenerateFormDialogOpen}
        onOpenChange={setIsGenerateFormDialogOpen}
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

      <ContactDetailsPanel
        open={isDetailsPanelOpen}
        onOpenChange={setIsDetailsPanelOpen}
        contactId={selectedContact}
      />
    </div>
  );
}
