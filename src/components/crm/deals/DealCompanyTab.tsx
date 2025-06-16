import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { usePeopleAndPartners } from "@/hooks/usePeopleAndPartners";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CompanySelect } from "@/components/ui/company-select";
import { Deal } from "@/types/deals";

interface DealCompanyTabProps {
  deal: Deal;
}

export function DealCompanyTab({ deal }: DealCompanyTabProps) {
  const [selectOpen, setSelectOpen] = useState(false);
  const { updateCompany } = usePeopleAndPartners(deal.id);

  const handleCompanySelect = async (companyId: string) => {
    try {
      await updateCompany.mutateAsync({ dealId: deal.id, companyId });
      setSelectOpen(false);
      toast.success("Empresa atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao vincular empresa:", error);
      toast.error("Erro ao vincular empresa");
    }
  };

  if (!deal.company) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-gray-500">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">Nenhuma empresa vinculada</p>
        <p className="text-sm text-gray-400 mb-4">
          Esta oportunidade não está vinculada a nenhuma empresa
        </p>
        <Button
          onClick={() => setSelectOpen(true)}
        >
          Vincular Empresa
        </Button>
      </div>
    );
  }

  const CompanyInfo = ({ icon: Icon, label, value, href }: any) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {value}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm text-gray-500">{value || "Não informado"}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Empresa</h3>
            <p className="text-sm text-gray-500">
              Informações da empresa vinculada a esta oportunidade
            </p>
          </div>
        </div>

        {/* Company Details */}
        <ScrollArea className="h-[calc(100vh-15rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CompanyInfo
              icon={Building2}
              label="Nome da Empresa"
              value={deal.company.name}
            />

            <CompanyInfo
              icon={Mail}
              label="E-mail"
              value={deal.company.email}
              href={deal.company.email ? `mailto:${deal.company.email}` : undefined}
            />

            <CompanyInfo
              icon={Phone}
              label="Telefone"
              value={deal.company.phone}
              href={deal.company.phone ? `tel:${deal.company.phone}` : undefined}
            />

            <CompanyInfo
              icon={Globe}
              label="Website"
              value={deal.company.website}
              href={deal.company.website}
            />

            <CompanyInfo
              icon={MapPin}
              label="Endereço"
              value={[deal.company.address, deal.company.city, deal.company.state, deal.company.country]
                .filter(Boolean)
                .join(", ")}
            />

            <CompanyInfo
              icon={Users}
              label="Tamanho da Empresa"
              value={deal.company.size}
            />

            <CompanyInfo
              icon={DollarSign}
              label="Faturamento Anual"
              value={deal.company.revenue}
            />

            <CompanyInfo
              icon={Building2}
              label="Setor"
              value={deal.company.sector}
            />
          </div>
        </ScrollArea>

        {/* Dialog de seleção de empresa */}
        <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Selecionar Empresa</DialogTitle>
              <DialogDescription>
                Escolha uma empresa para vincular a este negócio
              </DialogDescription>
            </DialogHeader>
            <CompanySelect onSelect={handleCompanySelect} />
            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectOpen(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
