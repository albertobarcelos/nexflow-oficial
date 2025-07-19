// AIDEV-NOTE: Editor de informações de localização da empresa

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, X } from "lucide-react";
import { MapPin } from "lucide-react";

interface LocationEditorProps {
  locationData: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  setLocationData: (data: any) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Componente para edição de informações de localização da empresa
 */
const LocationEditor = ({
  locationData,
  setLocationData,
  isSaving,
  onSave,
  onCancel,
}: LocationEditorProps) => {
  const handleChange = (field: string, value: string) => {
    setLocationData({ ...locationData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div className="grid grid-cols-1 gap-3 w-full">
            <div className="flex gap-2">
              <Input
                value={locationData.street || ""}
                onChange={(e) => handleChange("street", e.target.value)}
                placeholder="Rua"
                className="h-8 flex-1"
              />
              <Input
                value={locationData.number || ""}
                onChange={(e) => handleChange("number", e.target.value)}
                placeholder="Número"
                className="h-8 w-24"
              />
            </div>
            
            <Input
              value={locationData.complement || ""}
              onChange={(e) => handleChange("complement", e.target.value)}
              placeholder="Complemento"
              className="h-8"
            />
            
            <Input
              value={locationData.neighborhood || ""}
              onChange={(e) => handleChange("neighborhood", e.target.value)}
              placeholder="Bairro"
              className="h-8"
            />
            
            <div className="flex gap-2">
              <Input
                value={locationData.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Cidade"
                className="h-8 flex-1"
              />
              <Input
                value={locationData.state || ""}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="Estado"
                className="h-8 w-24"
              />
            </div>
            
            <Input
              value={locationData.zip_code || ""}
              onChange={(e) => handleChange("zip_code", e.target.value)}
              placeholder="CEP"
              className="h-8"
            />
          </div>
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

export default LocationEditor;