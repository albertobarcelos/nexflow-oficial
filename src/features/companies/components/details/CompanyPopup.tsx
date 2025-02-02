import { Company } from "@/types/company";
import { formatPhone, formatCNPJ } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
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
  if (!company || !onOpenChange) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader className="flex items-center justify-between space-y-0">
          <div>
            <SheetTitle>Detalhes da Empresa</SheetTitle>
            <SheetDescription>
              Informações detalhadas sobre a empresa
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative -right-2 -top-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </SheetClose>
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
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-muted">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Pessoas</span>
              </div>
              {company.people && company.people.length > 0 ? (
                <div className="space-y-4">
                  {company.people.map((person) => (
                    <div key={person.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{person.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma pessoa cadastrada</p>
              )}
            </div>

            {/* Integrantes */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-muted">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Integrantes</span>
              </div>
              {company.collaborators && company.collaborators.length > 0 ? (
                <div className="space-y-4">
                  {company.collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{collaborator.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum integrante cadastrado</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
