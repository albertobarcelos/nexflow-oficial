// AIDEV-NOTE: Componente para adicionar nova nota estilo tarefa

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Save } from "lucide-react";

interface AddNoteCardProps {
  onSave: (note: {
    content: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Componente para adicionar nova nota
 */
export const AddNoteCard = ({ onSave, isLoading }: AddNoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      await onSave({
        content: content.trim()
      });

      // Reset form
      setContent('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
    }
  };

  const handleCancel = () => {
    setContent('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(true)}
          >
            <Plus className="h-4 w-4" />
            Adicionar nova nota...
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Conteúdo */}
        <div>
          <Textarea
            placeholder="Escreva sua nota aqui..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="resize-none"
            autoFocus
          />
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!content.trim() || isLoading}
          >
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddNoteCard;