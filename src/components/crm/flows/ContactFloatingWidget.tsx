import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { User, Sparkles } from "lucide-react";
import { ContactPopover } from "./ContactPopover";

interface ContactFloatingWidgetProps {
  contactId: string | null | undefined;
}

export function ContactFloatingWidget({
  contactId,
}: ContactFloatingWidgetProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (!contactId) {
    return null;
  }

  return (
    <ContactPopover
      contactId={contactId}
      open={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <Badge
        variant="default"
        className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-1 px-2 py-1"
        onClick={() => setIsPopoverOpen(true)}
      >
        <User className="h-2.5 w-2.5" />
        
      </Badge>
    </ContactPopover>
  );
}




