// AIDEV-NOTE: Editor de notas da empresa

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface NotesEditorProps {
  notes: string;
  setNotes: (notes: string) => void;
  isSaving: boolean;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
}

/**
 * Componente para edição de notas da empresa
 */
const NotesEditor = ({
  notes,
  setNotes,
  isSaving,
  onSave,
  onCancel,
}: NotesEditorProps) => {
  const handleSave = async () => {
    const success = await onSave();
    if (success) {
      toast.success("Notas salvas com sucesso!");
    } else {
      toast.error("Erro ao salvar notas");
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Adicione notas sobre esta empresa..."
        className="min-h-[200px]"
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
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

export default NotesEditor;