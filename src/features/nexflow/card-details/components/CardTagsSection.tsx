import { useState } from "react";
import { Plus, X, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCardTags, useAddCardTag, useRemoveCardTag } from "@/hooks/useCardTags";
import { useFlowTags } from "@/hooks/useFlowTags";

interface CardTagsSectionProps {
  cardId: string;
  flowId: string;
}

export function CardTagsSection({ cardId, flowId }: CardTagsSectionProps) {
  const { data: cardTags = [], isLoading: isLoadingCardTags } = useCardTags(cardId);
  const { data: flowTags = [], isLoading: isLoadingFlowTags } = useFlowTags(flowId);
  const addCardTag = useAddCardTag();
  const removeCardTag = useRemoveCardTag();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const availableTags = flowTags.filter(
    (flowTag) => !cardTags.some((cardTag) => cardTag.id === flowTag.id)
  );

  const handleAddTag = async (tagId: string) => {
    try {
      await addCardTag.mutateAsync({ cardId, tagId });
      setIsPopoverOpen(false);
    } catch (error) {
      // Erro já é tratado no hook
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeCardTag.mutateAsync({ cardId, tagId });
    } catch (error) {
      // Erro já é tratado no hook
    }
  };

  if (isLoadingCardTags || isLoadingFlowTags) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {cardTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-xs font-medium flex items-center gap-1.5 px-2 py-0.5"
          style={{
            backgroundColor: `${tag.color}20`,
            borderColor: tag.color,
            color: tag.color,
          }}
        >
          <Tag className="h-3 w-3" />
          {tag.name}
          <button
            onClick={() => handleRemoveTag(tag.id)}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {availableTags.length > 0 && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2 py-0 border-dashed"
              type="button"
            >
            <Tag className="h-2 w-2 " />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar tag..." />
              <CommandList>
                <CommandEmpty>Nenhuma tag disponível</CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleAddTag(tag.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {availableTags.length === 0 && flowTags.length === 0 && (
        <span className="text-xs text-gray-400 italic">
          Nenhuma tag disponível para este flow
        </span>
      )}
    </div>
  );
}

