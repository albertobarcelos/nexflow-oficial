// AIDEV-NOTE: Visualizador de notas da empresa

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface NotesViewerProps {
  notes: string;
  onEdit: () => void;
}

/**
 * Componente para visualização de notas da empresa
 */
const NotesViewer = ({ notes, onEdit }: NotesViewerProps) => {
  return (
    <div className="space-y-4">
      {notes ? (
        <div className="whitespace-pre-wrap text-sm">{notes}</div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma nota adicionada para esta empresa.
        </p>
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>
    </div>
  );
};

export default NotesViewer;