import { Button } from "@/components/ui/button";
import { Save, Undo2 } from "lucide-react";

interface CustomFieldsHeaderProps {
  hasChanges: boolean;
  onSave: () => void;
  onRevert: () => void;
}

export function CustomFieldsHeader({ hasChanges, onSave, onRevert }: CustomFieldsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Personalização de Campos</h1>
        <p className="text-muted-foreground">
          Personalize os campos do seu CRM de acordo com suas necessidades
        </p>
      </div>
      <div className="flex gap-2">
        {hasChanges && (
          <Button variant="outline" onClick={onRevert}>
            <Undo2 className="w-4 h-4 mr-2" />
            Reverter
          </Button>
        )}
        <Button onClick={onSave} disabled={!hasChanges}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}