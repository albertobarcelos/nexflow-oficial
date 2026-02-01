import { Globe, Shield, FileText, Settings, Edit, Trash2, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicContactForm } from "@/hooks/usePublicContactForms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FormCardProps {
  form: PublicContactForm;
  onEdit: (formId: string) => void;
  onDelete: (formId: string) => void;
  onSettings?: (formId: string) => void;
}

function getFormIcon(formType?: "public" | "internal") {
  switch (formType) {
    case "internal":
      return Shield;
    case "public":
      return Globe;
    default:
      return FileText;
  }
}

function getFormIconColor(formType?: "public" | "internal") {
  switch (formType) {
    case "internal":
      return "bg-blue-100 text-blue-600";
    case "public":
      return "bg-orange-100 text-orange-600";
    default:
      return "bg-purple-100 text-purple-600";
  }
}

function getStatusBadge(form: PublicContactForm) {
  if (!form.is_active) {
    return (
      <Badge variant="secondary" className="text-xs">
        RASCUNHO
      </Badge>
    );
  }

  if (form.form_type === "internal") {
    return (
      <Badge variant="default" className="bg-blue-600 text-xs">
        INTERNO
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="bg-green-600 text-xs">
        ATIVO
      </Badge>
  );
}

export function FormCard({ form, onEdit, onDelete, onSettings }: FormCardProps) {
  const Icon = getFormIcon(form.form_type);
  const iconColor = getFormIconColor(form.form_type);

  const formattedDate = form.created_at
    ? format(new Date(form.created_at), "dd MMM, yyyy", { locale: ptBR })
    : "";

  const getFormUrl = () => {
    const baseUrl = window.location.origin;
    if (form.form_type === "internal") {
      return `${baseUrl}/form/internal/${form.slug}`;
    }
    return `${baseUrl}/form/${form.slug}`;
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getFormUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Ícone e Informações */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("rounded-lg p-2 flex-shrink-0", iconColor)}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{form.title}</h3>
                {getStatusBadge(form)}
              </div>

              {form.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {form.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 w-8 p-0"
              title="Copiar link do formulário"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(form.id)}
              className="h-8 w-8 p-0"
              title="Editar formulário"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSettings(form.id)}
                className="h-8 w-8 p-0"
                title="Configurações"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(form.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Excluir formulário"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
