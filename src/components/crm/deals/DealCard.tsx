import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, DollarSign } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  value?: number | null;
  company_id?: string | null;
  person_id?: string | null;
  partner_id?: string | null;
  stage_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  client_id: string;
  funnel_id: string;
  description?: string | null;
  expected_close_date?: string | null;
  entity_type?: string | null;
  category_id?: string | null;
  origin_id?: string | null;
  origin_name?: string | null;
  partner?: {
    id: string;
    name: string;
    avatar_type?: string;
    avatar_seed?: string;
    custom_avatar_url?: string;
  } | null;
}

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Título */}
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {deal.title}
          </h3>

          {/* Valor */}
          {deal.value && (
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(deal.value)}
              </span>
            </div>
          )}

          {/* Empresa/Pessoa */}
          {deal.company_id && (
            <div className="flex items-center gap-1 text-gray-600">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Empresa</span>
            </div>
          )}

          {deal.person_id && (
            <div className="flex items-center gap-1 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Pessoa</span>
            </div>
          )}

          {/* Parceiro */}
          {deal.partner && (
            <Badge variant="secondary" className="text-xs">
              {deal.partner.name}
            </Badge>
          )}

          {/* Origem */}
          {deal.origin_name && (
            <Badge variant="outline" className="text-xs">
              {deal.origin_name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
