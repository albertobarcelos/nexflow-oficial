import { Company } from "@/types/company";
import { formatPhone, formatCNPJ } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  X,
  Map,
  Navigation,
  Users,
  UserPlus,
  Instagram,
  Building,
  Hash,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompanyPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
}

export function CompanyPopup({
  open,
  onOpenChange,
  company,
}: CompanyPopupProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Detalhes da Empresa</SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Informações detalhadas sobre a empresa
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="space-y-6 mt-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Dados Básicos</span>
              </div>
              <Separator />

              <div className="grid gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="w-4 h-4" />
                    Nome Fantasia
                  </div>
                  <div className="font-medium">{company.name}</div>
                </div>

                {company.razao_social && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      Razão Social
                    </div>
                    <div>{company.razao_social}</div>
                  </div>
                )}

                {company.cnpj && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="w-4 h-4" />
                      CNPJ
                    </div>
                    <div>{formatCNPJ(company.cnpj)}</div>
                  </div>
                )}

                {company.description && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      Descrição
                    </div>
                    <div className="text-sm">{company.description}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Contato</span>
              </div>
              <Separator />

              <div className="grid gap-4">
                {company.email && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                    <div>{company.email}</div>
                  </div>
                )}

                {company.whatsapp && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </div>
                    <div>{formatPhone(company.whatsapp)}</div>
                  </div>
                )}

                {company.celular && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      Celular
                    </div>
                    <div>{formatPhone(company.celular)}</div>
                  </div>
                )}

                {company.instagram && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </div>
                    <div>{company.instagram}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Localização</span>
              </div>
              <Separator />

              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  {company.city?.name && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      <Navigation className="w-3 h-3" />
                      {company.city.name}
                    </Badge>
                  )}
                  {company.state?.name && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      <Map className="w-3 h-3" />
                      {company.state.name}
                    </Badge>
                  )}
                </div>

                {company.cep && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      CEP
                    </div>
                    <div>{company.cep}</div>
                  </div>
                )}

                {company.bairro && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      Bairro
                    </div>
                    <div>{company.bairro}</div>
                  </div>
                )}

                {company.rua && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      Endereço
                    </div>
                    <div>
                      {company.rua}
                      {company.numero && `, ${company.numero}`}
                      {company.complemento && ` - ${company.complemento}`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pessoas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Pessoas</span>
                </div>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Pessoa
                </Button>
              </div>
              <Separator />

              <div className="text-sm text-muted-foreground text-center py-8">
                Nenhuma pessoa cadastrada
              </div>
            </div>

            {/* Integrantes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Integrantes</span>
                </div>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Integrante
                </Button>
              </div>
              <Separator />

              <div className="text-sm text-muted-foreground text-center py-8">
                Nenhum integrante cadastrado
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
