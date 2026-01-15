import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { useCardTimeline } from "@/hooks/useCardTimeline";
import { CardTimelineHorizontal } from "./CardTimelineHorizontal";
import type { NexflowCard } from "@/types/nexflow";

interface CardHistoryTabProps {
  card: NexflowCard;
}

export function CardHistoryTab({
  card,
}: CardHistoryTabProps) {
  const { data: timelineEvents = [], isLoading } = useCardTimeline(card?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Carregando histórico...</div>
      </div>
    );
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Sparkles className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Card recém-criado
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Criado em{" "}
          {format(new Date(card.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline da Jornada */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Timeline da Jornada</h3>
        <CardTimelineHorizontal events={timelineEvents} cardId={card?.id} />
      </div>
    </div>
  );
}

