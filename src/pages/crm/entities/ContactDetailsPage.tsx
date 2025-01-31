import { useParams } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { ContactDetails } from "@/components/crm/entities/contacts/ContactDetails";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ContactDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contacts, isLoading } = useContacts();
  const contact = contacts?.find((c) => c.id === id);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/crm/entities/contacts")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">
              {isLoading ? "Carregando..." : contact?.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualize e gerencie os detalhes do contato.
            </p>
          </div>
        </div>
      </div>

      {id && <ContactDetails contactId={id} />}
    </div>
  );
} 
