import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { IndicationPopover } from "./IndicationPopover";

interface IndicationFloatingWidgetProps {
  indicationId: string | null | undefined;
}

export function IndicationFloatingWidget({
  indicationId,
}: IndicationFloatingWidgetProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (!indicationId) {
    return null;
  }

  return (
    <IndicationPopover
      indicationId={indicationId}
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <Badge
        variant="outline"
        className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2 px-3 py-1.5"
        onClick={() => setIsPopoverOpen(true)}
      >
        <Target className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Indicação</span>
      </Badge>
    </IndicationPopover>
  );
}

