import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { User, Sparkles } from "lucide-react";
import { OpportunityPopover } from "./OpportunityPopover";

interface OpportunityFloatingWidgetProps {
  opportunityId: string | null | undefined;
}

export function OpportunityFloatingWidget({
  opportunityId,
}: OpportunityFloatingWidgetProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (!opportunityId) {
    return null;
  }

  return (
    <OpportunityPopover
      opportunityId={opportunityId}
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <Badge
        variant="outline"
        className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2 px-3 py-1.5"
        onClick={() => setIsPopoverOpen(true)}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Lead</span>
      </Badge>
    </OpportunityPopover>
  );
}




