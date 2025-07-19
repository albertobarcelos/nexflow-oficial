// AIDEV-NOTE: Editor de informações de contato da empresa

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, X } from "lucide-react";
import { Mail, Phone, Smartphone, Globe } from "lucide-react";

interface ContactEditorProps {
  contactData: {
    email?: string;
    phone?: string;
    mobile?: string;
    whatsapp?: string;
    website?: string;
  };
  setContactData: (data: any) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Componente para edição de informações de contato da empresa
 */
const ContactEditor = ({
  contactData,
  setContactData,
  isSaving,
  onSave,
  onCancel,
}: ContactEditorProps) => {
  const handleChange = (field: string, value: string) => {
    setContactData({ ...contactData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Input
            value={contactData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Email"
            className="h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Input
            value={contactData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Telefone"
            className="h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <Input
            value={contactData.mobile || ""}
            onChange={(e) => handleChange("mobile", e.target.value)}
            placeholder="Celular"
            className="h-8"
          />
        </div>

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
          <Input
            value={contactData.whatsapp || ""}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            placeholder="WhatsApp"
            className="h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Input
            value={contactData.website || ""}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="Website"
            className="h-8"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ContactEditor;