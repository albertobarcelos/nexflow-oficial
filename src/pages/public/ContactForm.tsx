import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { appConfig } from "@/lib/config";
import { FormFieldConfig } from "@/hooks/usePublicContactForms";

interface FormConfig {
  id: string;
  title: string;
  description?: string;
  slug: string;
  fields_config: FormFieldConfig[];
  settings?: {
    successMessage?: string;
    redirectUrl?: string;
  };
}

export function ContactFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) {
      setErrorMessage("Slug do formulário não fornecido");
      setIsLoading(false);
      return;
    }

    const fetchFormConfig = async () => {
      try {
        const response = await fetch(
          `${appConfig.supabase.url}/functions/v1/get-public-form?slug=${slug}`
        );

        if (!response.ok) {
          throw new Error("Formulário não encontrado");
        }

        const data = await response.json();
        setFormConfig(data);

        // Inicializar formData com valores vazios
        const initialData: Record<string, any> = {};
        data.fields_config.forEach((field: FormFieldConfig) => {
          initialData[field.name] = field.type === "select" ? "" : "";
        });
        setFormData(initialData);
      } catch (error) {
        console.error("Erro ao carregar formulário:", error);
        setErrorMessage("Formulário não encontrado ou inativo");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormConfig();
  }, [slug]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formConfig) return false;

    formConfig.fields_config.forEach((field) => {
      const value = formData[field.name];

      if (field.required) {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors[field.name] = `${field.label} é obrigatório`;
        }
      }

      // Validações específicas por tipo
      if (value && field.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field.name] = "Email inválido";
        }
      }

      if (value && field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors[field.name] = `Mínimo de ${field.validation.minLength} caracteres`;
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors[field.name] = `Máximo de ${field.validation.maxLength} caracteres`;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formConfig) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${appConfig.supabase.url}/functions/v1/submit-contact-form`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formData,
            slug: formConfig.slug,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar formulário");
      }

      setSubmitStatus("success");

      // Redirecionar se configurado
      if (formConfig.settings?.redirectUrl) {
        setTimeout(() => {
          window.location.href = formConfig.settings.redirectUrl!;
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao enviar formulário"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const renderField = (field: FormFieldConfig) => {
    const value = formData[field.name] || "";
    const error = formErrors[field.name];

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.name, val)}
              required={field.required}
            >
              <SelectTrigger className={error ? "border-destructive" : ""}>
                <SelectValue placeholder={field.placeholder || "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !formConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Formulário não encontrado</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!formConfig) {
    return null;
  }

  if (submitStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
          <h1 className="text-2xl font-bold">Formulário enviado com sucesso!</h1>
          <p className="text-muted-foreground">
            {formConfig.settings?.successMessage ||
              "Obrigado pelo seu interesse. Entraremos em contato em breve."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{formConfig.title}</h1>
            {formConfig.description && (
              <p className="text-muted-foreground">{formConfig.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formConfig.fields_config.map((field) => renderField(field))}

            {submitStatus === "error" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

