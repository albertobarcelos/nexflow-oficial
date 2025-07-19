// AIDEV-NOTE: Card de negócios vinculados à empresa (versão resumida para a aba Visão Geral)

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { useCompanyDeals } from "../../hooks/index";
import { Company } from "../../types";
import { formatCurrency } from "@/lib/format";

interface DealsCardProps {
  company: Company | null;
}

/**
 * Componente que exibe uma versão resumida dos negócios vinculados à empresa
 */
const DealsCard = ({ company }: DealsCardProps) => {
  const { data: deals = [], isLoading } = useCompanyDeals(company?.id);

  if (!company) return null;

  // Limita a exibição a 3 negócios na visão geral
  const displayDeals = deals.slice(0, 3);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Negócios Vinculados</CardTitle>
          <span className="text-xs text-muted-foreground">
            {deals.length} {deals.length === 1 ? "negócio" : "negócios"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : displayDeals.length > 0 ? (
          <div className="space-y-4">
            {displayDeals.map((deal) => (
              <div key={deal.id} className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{deal.title}</span>
                      {deal.stage_name && deal.stage_color && (
                        <Badge 
                          variant="outline" 
                          className="h-5 text-[10px]"
                          style={{ 
                            borderColor: deal.stage_color,
                            color: deal.stage_color 
                          }}
                        >
                          {deal.stage_name}
                        </Badge>
                      )}
                    </div>
                    <a 
                      href={`/crm/deals/${deal.id}`} 
                      className="text-primary hover:text-primary/80"
                      title="Ver detalhes do negócio"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(deal.value)}
                    </span>
                    {deal.funnel_name && (
                      <span className="text-xs text-muted-foreground">
                        {deal.funnel_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {deals.length > 3 && (
              <p className="text-xs text-muted-foreground pt-1">
                + {deals.length - 3} {deals.length - 3 === 1 ? "negócio" : "negócios"} não exibidos
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum negócio vinculado a esta empresa
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DealsCard;