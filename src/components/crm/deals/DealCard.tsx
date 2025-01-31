import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Pencil, Calendar } from "lucide-react";
import { DealDialog } from "./DealDialog";
import { Badge } from "@/components/ui/badge";
import { PartnerAvatar } from "@/components/partners/PartnerAvatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DealCardProps {
  deal: any;
}

export function DealCard({ deal }: DealCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");

  const handleView = () => {
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleEdit = () => {
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <>
      <Card 
        className="group p-4 space-y-3 cursor-pointer hover:shadow-lg transition-all border-l-4 bg-gradient-to-br from-white to-gray-50/50"
        style={{ borderLeftColor: deal.tags?.[0]?.color || '#e2e8f0' }}
        onClick={handleView}
      >
        {/* Cabeçalho com Tags e Avatar */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Tags em destaque */}
            <div className="flex flex-wrap gap-1 mb-2">
              {deal.tags?.map((tag: any) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs font-medium px-2 py-0.5 bg-opacity-20"
                  style={{ 
                    backgroundColor: `${tag.color}30`,
                    color: tag.color,
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
            
            {/* Título e Empresa */}
            <h3 className="font-medium text-base mb-1 text-gray-800">{deal.title}</h3>
            {deal.companies?.name && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                {deal.companies.name}
              </p>
            )}
          </div>

          {/* Avatar do Parceiro */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <PartnerAvatar partner={deal.partner} showStatus />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{deal.partner ? `Parceiro: ${deal.partner.name}` : 'Sem parceiro'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Valor e Informações */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {deal.value && (
              <p className="text-sm font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-md">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(deal.value)}
              </p>
            )}
            {deal.next_contact && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {new Date(deal.next_contact).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          <div 
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {deal.people?.phone && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-green-50 hover:text-green-600 transition-colors"
                      onClick={() => handleWhatsApp(deal.people.phone)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enviar WhatsApp</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => handleCall(deal.people.phone)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ligar</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100 transition-colors"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar negócio</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>

      <DealDialog 
        deal={deal}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mode={dialogMode}
      />
    </>
  );
} 
