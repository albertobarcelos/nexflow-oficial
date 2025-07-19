// AIDEV-NOTE: Componente individual de nota estilo tarefa

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Edit, Trash2, Save, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    created_at: string;
    updated_at?: string;
    created_by: string;
  };
  isEditing?: boolean;
  onEdit?: (noteId: string) => void;
  onUpdate?: (noteId: string, content: string) => Promise<void>;
  onCancelEdit?: () => void;
  onDelete?: (noteId: string) => void;
}

/**
 * Componente que exibe uma nota individual estilo tarefa
 */
export const NoteCard = ({ 
  note, 
  isEditing = false, 
  onEdit, 
  onUpdate, 
  onCancelEdit, 
  onDelete 
}: NoteCardProps) => {
  const [editContent, setEditContent] = useState(note.content);
  const [isUpdating, setIsUpdating] = useState(false);

  const getInitials = (userId: string) => {
    // Gerar iniciais baseadas no ID do usuário
    return userId.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data inválida';
    }
  };

  const handleSave = async () => {
    if (!onUpdate || !editContent.trim()) return;
    
    setIsUpdating(true);
    try {
      await onUpdate(note.id, editContent.trim());
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditContent(note.content);
    onCancelEdit?.();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header da nota */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(note.created_by)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {formatDate(note.created_at)}
                {note.updated_at && note.updated_at !== note.created_at && (
                  <span> • editado {formatDate(note.updated_at)}</span>
                )}
              </p>
            </div>
          </div>

          {/* Menu de ações ou botões de edição */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSave}
                disabled={isUpdating || !editContent.trim()}
                className="h-8 px-2"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                disabled={isUpdating}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(note.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(note.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Conteúdo da nota */}
        <div className="pl-11">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Digite o conteúdo da nota..."
              className="min-h-[80px] resize-none"
              disabled={isUpdating}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {note.content}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteCard;