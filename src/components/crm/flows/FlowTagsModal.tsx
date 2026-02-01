import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFlowTags, useCreateFlowTag, useUpdateFlowTag, useDeleteFlowTag } from "@/hooks/useFlowTags";
import type { FlowTag } from "@/types/nexflow";
import { Edit2, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FlowTagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

// Paleta de cores predefinidas
const TAG_COLORS = [
  "#94a3b8", // neutral-400 (padrão)
  "#ef4444", // red-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
];

export function FlowTagsModal({ open, onOpenChange, flowId, flowName }: FlowTagsModalProps) {
  const { data: tags = [], isLoading } = useFlowTags(flowId);
  const createTag = useCreateFlowTag();
  const updateTag = useUpdateFlowTag();
  const deleteTag = useDeleteFlowTag();

  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState<FlowTag | null>(null);
  const [tagToDelete, setTagToDelete] = useState<FlowTag | null>(null);

  // Resetar formulário quando modal abrir/fechar
  useEffect(() => {
    if (!open) {
      setTagName("");
      setTagColor(TAG_COLORS[0]);
      setEditingTag(null);
      setTagToDelete(null);
    }
  }, [open]);

  // Preencher formulário quando editar
  useEffect(() => {
    if (editingTag) {
      setTagName(editingTag.name);
      setTagColor(editingTag.color);
    }
  }, [editingTag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tagName.trim()) {
      return;
    }

    if (editingTag) {
      // Atualizar tag existente
      await updateTag.mutateAsync({
        id: editingTag.id,
        name: tagName.trim(),
        color: tagColor,
      });
      setEditingTag(null);
    } else {
      // Criar nova tag
      await createTag.mutateAsync({
        flowId,
        name: tagName.trim(),
        color: tagColor,
      });
    }

    setTagName("");
    setTagColor(TAG_COLORS[0]);
  };

  const handleEdit = (tag: FlowTag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setTagName("");
    setTagColor(TAG_COLORS[0]);
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    await deleteTag.mutateAsync({
      id: tagToDelete.id,
      flowId,
    });

    setTagToDelete(null);
  };

  const isSubmitting = createTag.isPending || updateTag.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Tags - {flowName}</DialogTitle>
            <DialogDescription>
              Crie e gerencie tags para organizar e categorizar os cards deste flow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Lista de tags existentes */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Tags Existentes</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : tags.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">Nenhuma tag criada ainda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="h-4 w-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-medium truncate">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(tag)}
                          disabled={isSubmitting}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setTagToDelete(tag)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário para criar/editar tag */}
            <div className="border-t pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">
                    {editingTag ? "Editar Tag" : "Nova Tag"}
                  </Label>
                  <Input
                    id="tag-name"
                    placeholder="Nome da tag"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "h-10 w-10 rounded-full border-2 transition-all",
                          tagColor === color
                            ? "border-neutral-900 scale-110"
                            : "border-neutral-300 hover:border-neutral-400"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setTagColor(color)}
                        disabled={isSubmitting}
                        aria-label={`Selecionar cor ${color}`}
                      />
                    ))}
                    <Input
                      type="color"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      className="h-10 w-16 cursor-pointer"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingTag && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting || !tagName.trim()}>
                    {isSubmitting ? (
                      "Salvando..."
                    ) : editingTag ? (
                      "Atualizar Tag"
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Tag
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para deletar */}
      <AlertDialog open={Boolean(tagToDelete)} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a tag <strong>{tagToDelete?.name}</strong>?
              {tagToDelete && (
                <span className="block mt-2 text-xs text-gray-500">
                  Esta ação não pode ser desfeita. Se a tag estiver sendo usada em cards, a operação será negada.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTag.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTag.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteTag.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

