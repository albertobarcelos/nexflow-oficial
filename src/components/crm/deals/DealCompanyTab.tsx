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

interface DealCompanyTabProps {
  dealId: string;
  mode: "view" | "edit";
}

export function DealCompanyTab({ dealId, mode }: DealCompanyTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { company, isLoadingCompany, updateCompany } = usePeopleAndPartners(dealId);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompany.mutateAsync(company);
      setIsEditing(false);
      toast.success("Informações da empresa atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar informações");
    }
  };

  if (isLoadingCompany) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-15rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-gray-500">Carregando informações da empresa...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-gray-500">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">Nenhuma empresa vinculada</p>
        <p className="text-sm text-gray-400">
          Esta oportunidade não está vinculada a nenhuma empresa
        </p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-800">Empresa</h3>
          <p className="text-sm text-gray-500">
            Informações da empresa vinculada a esta oportunidade
          </p>
        </div>
        {mode === "edit" && (
          <Button onClick={() => setIsEditing(true)}>
            Editar Informações
          </Button>
        )}
      </div>

      {/* Company Details */}
      <ScrollArea className="h-[calc(100vh-15rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CompanyInfo
            icon={Building2}
            label="Nome da Empresa"
            value={company.name}
          />

          <CompanyInfo
            icon={Mail}
            label="E-mail"
            value={company.email}
          />

          <CompanyInfo
            icon={Phone}
            label="Telefone"
            value={company.phone}
          />

          <CompanyInfo
            icon={Globe}
            label="Website"
            value={company.website}
            href={company.website}
          />

          <CompanyInfo
            icon={MapPin}
            label="Endereço"
            value={[company.address, company.city, company.state, company.country]
              .filter(Boolean)
              .join(", ")}
          />

          <CompanyInfo
            icon={Users}
            label="Tamanho"
            value={company.size}
          />

          <CompanyInfo
            icon={DollarSign}
            label="Faturamento"
            value={company.revenue}
          />
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Informações da Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações da empresa vinculada a esta oportunidade
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={company?.name}
                  onChange={(e) => updateCompany.mutate({ ...company, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={company?.website}
                  onChange={(e) => updateCompany.mutate({ ...company, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={company?.email}
                  onChange={(e) => updateCompany.mutate({ ...company, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={company?.phone}
                  onChange={(e) => updateCompany.mutate({ ...company, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={company?.address}
                  onChange={(e) => updateCompany.mutate({ ...company, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employees">Número de Funcionários</Label>
                <Input
                  id="employees"
                  type="number"
                  value={company?.employees_count}
                  onChange={(e) => updateCompany.mutate({ ...company, employees_count: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue">Faturamento Anual</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={company?.annual_revenue}
                  onChange={(e) => updateCompany.mutate({ ...company, annual_revenue: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={company?.cnpj}
                  onChange={(e) => updateCompany.mutate({ ...company, cnpj: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
