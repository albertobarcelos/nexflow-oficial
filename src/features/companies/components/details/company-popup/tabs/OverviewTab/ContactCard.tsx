// AIDEV-NOTE: Card de informações de contato da empresa com funcionalidade de edição

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasContactInfo } from "../../utils";
import { Company } from "../../types";
import { formatPhone } from "@/lib/format";
import { Mail, Phone, Smartphone, Globe, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyContact } from "../../hooks/index";
import ContactEditor from "./ContactEditor";

interface ContactCardProps {
  company: Company | null;
}

/**
 * Componente que exibe as informações de contato da empresa com opção de edição
 */
const ContactCard = ({ company }: ContactCardProps) => {
  if (!company) return null;

  const {
    contactData,
    setContactData,
    isEditing,
    setIsEditing,
    isSaving,
    handleSave,
    handleCancel
  } = useCompanyContact(company);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Informações de Contato</CardTitle>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <ContactEditor
            contactData={contactData}
            setContactData={setContactData}
            isSaving={isSaving}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : hasContactInfo(company) ? (
          <div className="space-y-2">
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${company.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {company.email}
                </a>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${company.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {formatPhone(company.phone)}
                </a>
              </div>
            )}

            {company.mobile && (
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${company.mobile}`}
                  className="text-sm text-primary hover:underline"
                >
                  {formatPhone(company.mobile)}
                </a>
              </div>
            )}

            {company.whatsapp && (
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M9.5 13.5c.5 1 1.5 1 2 1s1.5 0 2-1" />
                </svg>
                <a
                  href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {formatPhone(company.whatsapp)}
                </a>
              </div>
            )}

            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma informação de contato disponível
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCard;