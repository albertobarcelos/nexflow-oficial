import { Loader2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCardTags } from "@/hooks/useCardTags";

interface ListCardTagsProps {
  cardId: string;
}

export function ListCardTags({ cardId }: ListCardTagsProps) {
  const { data: cardTags = [], isLoading } = useCardTags(cardId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (cardTags.length === 0) {
    return <span className="text-neutral-400 text-xs italic">--</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-full">
      {cardTags.slice(0, 2).map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-[10px] font-medium px-1.5 py-0.5 border shrink-0 max-w-[90px] truncate"
          style={{
            backgroundColor: `${tag.color}15`,
            borderColor: tag.color,
            color: tag.color,
          }}
          title={tag.name}
        >
          <Tag className="h-2.5 w-2.5 mr-0.5 shrink-0" />
          <span className="truncate">{tag.name}</span>
        </Badge>
      ))}
      {cardTags.length > 2 && (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0.5 shrink-0"
          title={`${cardTags.length - 2} tags adicionais`}
        >
          +{cardTags.length - 2}
        </Badge>
      )}
    </div>
  );
}

