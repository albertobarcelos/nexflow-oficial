import { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Phone, User, ExternalLink, Loader2, CreditCard, Target } from "lucide-react";
import { useIndicationById } from "@/hooks/useIndicationById";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "@/components/ui/user-avatar";

interface IndicationPopoverProps {
  indicationId: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function IndicationPopover({
  indicationId,
  open,
  onOpenChange,
  children,
}: IndicationPopoverProps) {
  const { data: indication, isLoading } = useIndicationById(indicationId);
  const navigate = useNavigate();

  if (!indicationId) {
    return <>{children}</>;
  }

  const handleViewDetails = () => {
    // Navegar para página de detalhes da indicação
    navigate(`/crm/hunters`);
    onOpenChange(false);
    // TODO: Implementar navegação direta para a indicação quando possível
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !indication ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Indicação não encontrada
          </div>
        ) : (
          <div className="space-y-0">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-start gap-3">
                <UserAvatar
                  user={{
                    avatar_type: "toy_face",
                    avatar_seed: "1|1",
                    name: indication.indication_name || "Indicação",
                  }}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {indication.indication_name || "Indicação sem nome"}
                  </h4>
                  {indication.responsible && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      Responsável: {indication.responsible}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações principais */}
            <div className="p-4 space-y-3">
              {indication.cnpj_cpf && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" />
                    CNPJ/CPF
                  </div>
                  <p className="text-sm font-mono">{indication.cnpj_cpf}</p>
                </div>
              )}

              {indication.phone && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Telefone
                  </div>
                  <p className="text-sm font-mono">{indication.phone}</p>
                </div>
              )}

              {indication.hunter && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />
                    Indicado por
                  </div>
                  <p className="text-sm">
                    {indication.hunter.name || indication.hunter.email || "Hunter desconhecido"}
                  </p>
                </div>
              )}

              {indication.status && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    Status
                  </div>
                  <Badge
                    variant={
                      indication.status === "converted"
                        ? "default"
                        : indication.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {indication.status === "pending"
                      ? "Pendente"
                      : indication.status === "processed"
                      ? "Processado"
                      : indication.status === "converted"
                      ? "Convertido"
                      : "Rejeitado"}
                  </Badge>
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

