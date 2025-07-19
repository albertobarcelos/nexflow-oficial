// AIDEV-NOTE: Componente principal da aba Notas estilo tarefas

import { TabProps } from "../../types";
import { useCompanyNotes } from "../../hooks/index";
import NoteCard from "../../components/NoteCard";
import AddNoteCard from "../../components/AddNoteCard";
import { useState, useMemo } from "react";

/**
 * Componente que exibe a aba de Notas da empresa estilo tarefas
 */
const NotesTab = ({ company }: TabProps) => {
  const { data: notes = [], isLoading, createNote, updateNote, deleteNote } = useCompanyNotes(company?.id);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Filtrar e ordenar notas por data de criação
  const sortedNotes = useMemo(() => {
    return notes.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notes]);

  if (!company) return null;

  const handleCreateNote = async (noteData: {
    content: string;
  }) => {
    setIsCreating(true);
    try {
      await createNote.mutateAsync({
        content: noteData.content,
        company_id: company.id,
        client_id: company.client_id || '1' // TODO: Pegar client_id do contexto
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      await updateNote.mutateAsync({
        id: noteId,
        content: content
      });
      setEditingNoteId(null);
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      await deleteNote.mutateAsync(noteId);
    }
  };

  const handleAddNote = async (noteData: {
    content: string;
  }) => {
    await handleCreateNote(noteData);
  };

  const handleDeleteNoteConfirm = async (noteId: string) => {
    await handleDeleteNote(noteId);
  };
  
  return (
    <div className="py-4 space-y-4">
      {/* Header simplificado */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Notas ({sortedNotes.length})
        </h3>
      </div>

      {/* Formulário para adicionar nova nota */}
      <AddNoteCard onSave={handleAddNote} isLoading={isCreating} />

      {/* Lista de notas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Carregando notas...</p>
        </div>
      ) : sortedNotes.length > 0 ? (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingNoteId === note.id}
              onEdit={handleEditNote}
              onUpdate={handleUpdateNote}
              onCancelEdit={handleCancelEdit}
              onDelete={handleDeleteNoteConfirm}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhuma nota encontrada. Adicione a primeira nota acima!
          </p>
        </div>
      )}
    </div>
  );
};

export default NotesTab;