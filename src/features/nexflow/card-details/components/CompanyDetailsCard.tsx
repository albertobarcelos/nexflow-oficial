import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CompanyDetails } from "../hooks/useCompanyDetails";

interface CompanyDetailsCardProps {
  company: CompanyDetails;
  className?: string;
}

/** Exibe valor somente se existir */
function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value == null || value === "") return null;

  return (
    <div className="flex gap-3 py-2">
      {Icon && (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

/** Link externo quando valor é URL */
function LinkField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value == null || value === "") return null;

  const href = value.startsWith("http") ? value : `https://${value}`;

  return (
    <div className="flex gap-3 py-2">
      {Icon && (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1 break-all"
        >
          {value}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      </div>
    </div>
  );
}

/**
 * Card que exibe todos os dados da empresa vinculada ao card.
 * Organizado em seções: Identificação, Contato, Endereço, Web, Negócio.
 */
export function CompanyDetailsCard({ company, className }: CompanyDetailsCardProps) {
  // Monta endereço completo
  const addressParts = [
    company.rua,
    company.numero ? `nº ${company.numero}` : null,
    company.complemento,
    company.bairro,
    company.cep,
  ].filter(Boolean);
  const cityState = [
    company.city?.name,
    company.state?.uf ? `/${company.state.uf}` : company.state?.name,
  ]
    .filter(Boolean)
    .join(" ");
  const fullAddress = [...addressParts, cityState, company.pais]
    .filter(Boolean)
    .join(", ");

  const hasIdentification =
    company.name || company.razao_social || company.cnpj;
  const hasContact =
    company.telefone ||
    company.phone ||
    company.celular ||
    company.whatsapp ||
    company.email ||
    company.skype;
  const hasAddress = fullAddress;
  const hasWeb =
    company.website ||
    company.facebook ||
    company.instagram ||
    company.linkedin ||
    company.twitter;
  const hasBusiness =
    company.categoria ||
    company.segment ||
    company.setor ||
    company.size ||
    company.origem ||
    company.description;

  return (
    <Card className={cn("bg-card text-card-foreground", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Dados da empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identificação */}
        {hasIdentification && (
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Identificação
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Field label="Nome" value={company.name} />
              <Field label="Razão Social" value={company.razao_social} />
              <Field label="CNPJ" value={company.cnpj} />
            </div>
          </section>
        )}

        {/* Contato */}
        {hasContact && (
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Field label="Telefone" value={company.telefone} icon={Phone} />
              <Field label="Phone" value={company.phone} icon={Phone} />
              <Field label="Celular" value={company.celular} icon={Phone} />
              <Field label="WhatsApp" value={company.whatsapp} icon={Phone} />
              <Field label="Email" value={company.email} icon={Mail} />
              <Field label="Skype" value={company.skype} icon={Phone} />
            </div>
          </section>
        )}

        {/* Endereço */}
        {hasAddress && (
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Endereço
            </h4>
            <div className="flex gap-3 py-2">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Endereço completo
                </div>
                <div className="text-sm text-foreground break-words">
                  {fullAddress}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Web / Redes sociais */}
        {hasWeb && (
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Web e redes sociais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <LinkField label="Site" value={company.website} icon={Globe} />
              <LinkField label="Facebook" value={company.facebook} icon={Globe} />
              <LinkField label="Instagram" value={company.instagram} icon={Globe} />
              <LinkField label="LinkedIn" value={company.linkedin} icon={Globe} />
              <LinkField label="Twitter" value={company.twitter} icon={Globe} />
            </div>
          </section>
        )}

        {/* Negócio */}
        {hasBusiness && (
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Negócio
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Field label="Categoria" value={company.categoria} />
              <Field label="Segmento" value={company.segment} />
              <Field label="Setor" value={company.setor} />
              <Field label="Tamanho" value={company.size} />
              <Field label="Origem" value={company.origem} />
            </div>
            {company.description && (
              <div className="flex gap-3 py-2 mt-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Descrição
                  </div>
                  <div className="text-sm text-foreground break-words whitespace-pre-wrap">
                    {company.description}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Se não houver nenhum dado além do nome */}
        {!hasContact && !hasAddress && !hasWeb && !hasBusiness && hasIdentification && (
          <p className="text-sm text-muted-foreground">
            Apenas dados básicos disponíveis para esta empresa.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
