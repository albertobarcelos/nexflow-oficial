import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomField, FieldTemplate } from "../types";
import { Download, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FieldConfigurationManagerProps {
  fields: CustomField[];
  onImport: (fields: CustomField[]) => void;
}

const predefinedTemplates: FieldTemplate[] = [
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Template para lojas online",
    category: "retail",
    fields: [
      {
        name: "SKU",
        field_type: "short_text",
        description: "Código do produto",
        is_required: true
      },
      {
        name: "Preço",
        field_type: "currency",
        description: "Preço do produto",
        is_required: true
      }
    ]
  },
  {
    id: "service",
    name: "Prestação de Serviços",
    description: "Template para empresas de serviços",
    category: "services",
    fields: [
      {
        name: "Tipo de Serviço",
        field_type: "single_select",
        description: "Categoria do serviço",
        is_required: true
      },
      {
        name: "Duração Estimada",
        field_type: "time",
        description: "Tempo estimado do serviço",
        is_required: false
      }
    ]
  }
];

export function FieldConfigurationManager({ fields, onImport }: FieldConfigurationManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const { toast } = useToast();

  const handleExport = () => {
    const configData = JSON.stringify(fields, null, 2);
    const blob = new Blob([configData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "field-configuration.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuração exportada",
      description: "O arquivo foi baixado com sucesso."
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedFields = JSON.parse(e.target?.result as string);
          onImport(importedFields);
          toast({
            title: "Configuração importada",
            description: "Os campos foram importados com sucesso."
          });
        } catch (error) {
          toast({
            title: "Erro na importação",
            description: "O arquivo selecionado não é válido.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTemplateSelect = () => {
    const template = predefinedTemplates.find(t => t.id === selectedTemplate);
    if (template) {
      onImport(template.fields as CustomField[]);
      setIsOpen(false);
      toast({
        title: "Template aplicado",
        description: `O template ${template.name} foi aplicado com sucesso.`
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Configuração
        </Button>
        <Label htmlFor="import-file" className="cursor-pointer">
          <Button variant="outline" asChild>
            <div>
              <Upload className="w-4 h-4 mr-2" />
              Importar Configuração
            </div>
          </Button>
        </Label>
        <Input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          <Save className="w-4 h-4 mr-2" />
          Usar Template
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTemplate && (
              <div className="text-sm text-muted-foreground">
                {predefinedTemplates.find(t => t.id === selectedTemplate)?.description}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTemplateSelect} disabled={!selectedTemplate}>
              Aplicar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
