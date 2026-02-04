import { X, Save, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Importe o cn se estiver usando shadcn padrão

interface FormBuilderHeaderProps {
  formTitle: string;
  setFormTitle: (title: string) => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onPreview: () => void;
  isSaving?: boolean;
  onClose: () => void;
}

export function FormBuilderHeader({
  formTitle,
  setFormTitle,
  hasUnsavedChanges,
  onSave,
  onPreview,
  isSaving,
  onClose,
}: FormBuilderHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1 max-w-md">
          <Label htmlFor="form-title" className="text-xs text-gray-500 mb-1 block">
            Nome do Flow
          </Label>
          <Input
            id="form-title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="text-lg font-semibold"
            placeholder="Nome do flow"
          />
        </div>
        {hasUnsavedChanges && (
          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 bg-orange-50">
            Alterações não salvas
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        
        <Button
          size="sm"
          // Quando tem alterações, usamos null para o variant não sobrescrever nossa cor customizada
          variant={hasUnsavedChanges ? "default" : "secondary"} 
          className={cn(
            "transition-all duration-200", // Animação suave
            hasUnsavedChanges
              ? "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 ring-2 ring-orange-500 ring-offset-1" 
              : "opacity-50 cursor-not-allowed" // Estilo explicito de desabilitado se quiser forçar
          )}
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className=" bg-orange-600 w-4 h-4 mr-2" />
              Salvar
            </>
          )}
        </Button>

        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}