import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { List, Grid, Plus, Settings, UserPlus } from "lucide-react";

export type ContactsViewMode = "cards" | "list";

interface ContactsPageHeaderProps {
  viewMode: ContactsViewMode;
  onOpenAutomations: () => void;
  onAddContact: () => void;
}

/**
 * Header unificado da página de Contatos (cards e lista).
 * Mesmo título, descrição e conjunto de ações em ambas as visualizações.
 */
export function ContactsPageHeader({
  viewMode,
  onOpenAutomations,
  onAddContact,
}: ContactsPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Contatos
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Visualize e gerencie os contatos de clientes e indicações
        </p>
      </div>
      <div className="flex gap-2">
        {viewMode === "cards" ? (
          <Button
            variant="outline"
            onClick={() => navigate("/crm/contacts/list")}
          >
            <List className="mr-2 h-4 w-4" />
            Visualizar Lista
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate("/crm/contacts")}>
            <Grid className="mr-2 h-4 w-4" />
            Visualizar Cards
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate("/crm/forms")}>
          <Plus className="mr-2 h-4 w-4" />
          Gerar Formulário
        </Button>
        <Button variant="outline" onClick={onOpenAutomations}>
          <Settings className="mr-2 h-4 w-4" />
          Automações
        </Button>
        <Button variant="outline" onClick={onAddContact}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar novo contato
        </Button>
      </div>
    </div>
  );
}
