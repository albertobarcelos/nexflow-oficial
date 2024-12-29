import { useState } from "react";
import { FieldTypesSidebar } from "./FieldTypesSidebar";
import { PipelineFieldsEditor } from "./PipelineFieldsEditor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Undo2 } from "lucide-react";

export function CustomFieldsLayout() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    toast({
      title: "Alterações salvas",
      description: "Suas alterações foram salvas com sucesso.",
    });
    setHasChanges(false);
  };

  const handleRevert = () => {
    toast({
      title: "Alterações revertidas",
      description: "Suas alterações foram desfeitas.",
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Personalização de Campos</h1>
          <p className="text-muted-foreground">
            Personalize os campos do seu CRM de acordo com suas necessidades
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleRevert}>
              <Undo2 className="w-4 h-4 mr-2" />
              Reverter
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-6">
        <FieldTypesSidebar onFieldAdd={() => setHasChanges(true)} />
        <PipelineFieldsEditor onChange={() => setHasChanges(true)} />
      </div>
    </div>
  );
}