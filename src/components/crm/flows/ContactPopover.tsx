import { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Phone, Building2, User, ExternalLink, Loader2 } from "lucide-react";
import { useContactById } from "@/hooks/useContactById";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ContactPopoverProps {
  contactId: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function ContactPopover({
  contactId,
  open,
  onOpenChange,
  children,
}: ContactPopoverProps) {
  const { data: contact, isLoading } = useContactById(contactId);
  const navigate = useNavigate();

  if (!contactId) {
    return <>{children}</>;
  }

  const handleViewDetails = () => {
    // Navegar para página de detalhes do contato
    // Por enquanto, vamos apenas fechar o popover
    onOpenChange(false);
    // TODO: Implementar navegação quando a rota estiver disponível
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !contact ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Contato não encontrado
          </div>
        ) : (
          <div className="space-y-0">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-start gap-3">
                <UserAvatar
                  user={{
                    avatar_type: contact.avatar_type || "toy_face",
                    avatar_seed: contact.avatar_seed || "1|1",
                    name: contact.client_name,
                  }}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {contact.client_name}
                  </h4>
                  {contact.main_contact && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {contact.main_contact}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações principais */}
            <div className="p-4 space-y-3">
              {contact.company_names &&
                contact.company_names.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      Empresas
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {contact.company_names.slice(0, 2).map((company, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {company}
                        </Badge>
                      ))}
                      {contact.company_names.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{contact.company_names.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

              {contact.phone_numbers &&
                contact.phone_numbers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      Telefones
                    </div>
                    <div className="space-y-1">
                      {contact.phone_numbers.slice(0, 2).map((phone, idx) => (
                        <p key={idx} className="text-sm font-mono">
                          {phone}
                        </p>
                      ))}
                      {contact.phone_numbers.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{contact.phone_numbers.length - 2} mais
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>

            <Separator />

            {/* Footer com ação */}
            <div className="p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleViewDetails}
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Ver Detalhes
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}




