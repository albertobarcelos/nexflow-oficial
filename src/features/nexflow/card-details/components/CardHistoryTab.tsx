import { CardTimelineUnified } from "./CardTimelineUnified";
import type { NexflowCard } from "@/types/nexflow";

interface CardHistoryTabProps {
  card: NexflowCard;
}

export function CardHistoryTab({
  card,
}: CardHistoryTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Timeline da Jornada</h3>
        <CardTimelineUnified card={card} />
      </div>
    </div>
  );
}

