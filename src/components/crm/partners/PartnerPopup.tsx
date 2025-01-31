import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Partner } from "@/types/partner";
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Trophy,
  Medal,
  Linkedin,
  Instagram,
  ArrowUpRight,
  FileText,
  Briefcase,
  Users,
  ChevronRight,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatPhoneNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NewIndicationDialog } from "./NewIndicationDialog";
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Funções de formatação
const formatCNPJ = (cnpj: string) => {
  // Remove caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '');
  
  // Aplica a máscara do CNPJ: XX.XXX.XXX/XXXX-XX
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

interface PartnerPopupProps {
  partner: Partner;
  open: boolean;
  onClose: () => void;
}

export function PartnerPopup({ partner, open, onClose }: PartnerPopupProps) {
  const navigate = useNavigate();
  const [isNewIndicationOpen, setIsNewIndicationOpen] = useState(false);

  // Buscar indicações do parceiro
  const { data: indications, isLoading: isLoadingIndications } = useQuery({
    queryKey: ["partner-indications", partner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_indications")
        .select(`
          id,
          status,
          indication_date,
          companies (
            id,
            name,
            cnpj
          )
        `)
        .eq("partner_id", partner.id)
        .eq("client_id", partner.client_id);

      if (error) throw error;
      return data;
    },
  });

  console.log("PartnerPopup - Renderizado", { 
    partner,
    hasIndications: !!indications,
    indicationsLength: indications?.length
  });

  const getPartnerTypeLabel = (type: string) => {
    const types = {
      AFILIADO: { label: "Afiliado", class: "bg-blue-500" },
      AGENTE_STONE: { label: "Agente Stone", class: "bg-green-500" },
      CONTADOR: { label: "Contador", class: "bg-purple-500" }
    };
    return types[type as keyof typeof types] || { label: type, class: "bg-gray-500" };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDENTE: "bg-yellow-500",
      ATIVO: "bg-green-500",
      INATIVO: "bg-gray-500",
      BLOQUEADO: "bg-red-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px]">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <SheetTitle className="text-2xl flex items-center gap-2">
                {partner.name}
                <Badge className={getPartnerTypeLabel(partner.partner_type).class}>
                  {getPartnerTypeLabel(partner.partner_type).label}
                </Badge>
                <Badge className={getStatusColor(partner.status)}>
                  {partner.status}
                </Badge>
              </SheetTitle>
              {partner.company && (
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4" />
                  {partner.company.name}
                  {partner.role && ` • ${partner.role}`}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Informações Básicas</h3>
            <div className="grid gap-2 text-sm">
              {partner.birth_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(partner.birth_date), "PPP", { locale: ptBR })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${partner.email}`} className="hover:underline">
                  {partner.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`https://wa.me/${partner.whatsapp}`} className="hover:underline">
                  {formatPhoneNumber(partner.whatsapp)}
                </a>
              </div>
              {partner.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPhoneNumber(partner.phone)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Redes Sociais */}
          {(partner.linkedin || partner.instagram) && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Redes Sociais</h3>
              <div className="grid gap-2 text-sm">
                {partner.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={partner.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      LinkedIn
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {partner.instagram && (
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`https://instagram.com/${partner.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      {partner.instagram}
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empresas Indicadas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Empresas Indicadas</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewIndicationOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Indicação
              </Button>
            </div>
            {isLoadingIndications ? (
              <div>Carregando indicações...</div>
            ) : indications && indications.length > 0 ? (
              <div className="space-y-2">
                {indications.map((indication) => (
                  <div
                    key={indication.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{indication.companies.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          CNPJ: {formatCNPJ(indication.companies.cnpj)}
                        </p>
                      </div>
                      <Badge>{indication.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Indicado em: {formatDate(indication.indication_date)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground border rounded-lg">
                <Building2 className="w-8 h-8 mx-auto mb-2" />
                <p>Parceiro sem Nenhuma Indicação</p>
              </div>
            )}
          </div>

          {/* Gamificação */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Gamificação</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>Nível {partner.current_level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-muted-foreground" />
                <span>{partner.points} pontos acumulados</span>
              </div>
              <div>
                <span className="font-medium">Total de Indicações:</span>{" "}
                {indications?.length || 0}
              </div>
            </div>
          </div>

          {/* Descrição */}
          {partner.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
              <p className="text-sm">{partner.description}</p>
            </div>
          )}
        </div>
      </SheetContent>

      {/* Dialog de Nova Indicação */}
      <NewIndicationDialog
        partner={partner}
        open={isNewIndicationOpen}
        onClose={() => setIsNewIndicationOpen(false)}
      />
    </Sheet>
  );
}