import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTags, type Tag } from "@/hooks/useTags";
import { cn } from "@/lib/utils";

interface TagSelectProps {
  dealId: string;
}

export function TagSelect({ dealId }: TagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#94A3B8");

  const { tags, dealTags, createTag, addTagToDeal, removeTagFromDeal } = useTags(dealId);

  // Filtrar tags baseado na busca
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  // Verificar se uma tag está selecionada
  const isTagSelected = (tagId: string) =>
    dealTags.some((tag) => tag.id === tagId);

  // Alternar seleção de tag
  const toggleTag = async (tag: Tag) => {
    if (isTagSelected(tag.id)) {
      await removeTagFromDeal.mutateAsync({ dealId, tagId: tag.id });
    } else {
      await addTagToDeal.mutateAsync({ dealId, tagId: tag.id });
    }
  };

  // Criar nova tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    await createTag.mutateAsync({
      name: newTagName.trim(),
      color: newTagColor,
    });

    setNewTagName("");
    setNewTagColor("#94A3B8");
    setIsCreating(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <Input
            placeholder="Buscar tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />

          <div className="space-y-2">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  role="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md transition-colors",
                    isTagSelected(tag.id)
                      ? "bg-secondary"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </div>
                  {isTagSelected(tag.id) && (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma tag encontrada
              </p>
            )}
          </div>

          {!isCreating ? (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar nova tag
            </Button>
          ) : (
            <form onSubmit={handleCreateTag} className="space-y-2">
              <Input
                placeholder="Nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="h-8"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-8 h-8 rounded-md"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1"
                  disabled={!newTagName.trim()}
                >
                  Criar tag
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Componente para exibir as tags de um negócio
export function DealTags({ dealId }: { dealId: string }) {
  const { dealTags, isLoadingDealTags } = useTags(dealId);

  if (isLoadingDealTags) {
    return <div className="animate-pulse h-6 w-20 bg-muted rounded-full" />;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {dealTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="h-6 gap-1 pl-2 pr-2"
          style={{ backgroundColor: tag.color + "20" }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </Badge>
      ))}
    </div>
  );
} 
