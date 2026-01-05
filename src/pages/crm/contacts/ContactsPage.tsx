import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useOpportunities } from "@/hooks/useOpportunities";
import { ContactCard } from "@/components/crm/contacts/ContactCard";
import { RocketLoader } from "@/components/ui/rocket-loader";
import { Loader2, Settings, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AutoCreateConfigDialog } from "@/components/crm/contacts/AutoCreateConfigDialog";
import { CreateCardFromContactDialog } from "@/components/crm/contacts/CreateCardFromContactDialog";
import { ContactDetailsPanel } from "@/components/crm/contacts/ContactDetailsPanel";
import { GenerateFormDialog } from "@/components/crm/contacts/GenerateFormDialog";

export function ContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isAutoCreateDialogOpen, setIsAutoCreateDialogOpen] = useState(false);
  const [isCreateCardDialogOpen, setIsCreateCardDialogOpen] = useState(false);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isGenerateFormDialogOpen, setIsGenerateFormDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactForCard, setContactForCard] = useState<any>(null);
  
  const {
    opportunities,
    isLoading,
    isError,
    permissions,
  } = useOpportunities({ enabled: hasAccess });

  useEffect(() => {
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
          const { data: teamMembers, error: teamError } = await supabase
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
            Visualize e gerencie os contatos de clientes
          </p>
        </div>
        <div className="flex gap-2">
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
            AutoCreate Config
          </Button>
        </div>
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
      ) : opportunities.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Nenhum contato encontrado.
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
            {opportunities.map((contact, index) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={index}
                onClick={() => {
                  setSelectedContact(contact.id);
                  setIsDetailsPanelOpen(true);
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
