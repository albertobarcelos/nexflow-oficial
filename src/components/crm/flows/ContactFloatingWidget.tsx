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
        variant="outline"
        className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2 px-3 py-1.5"
        onClick={() => setIsPopoverOpen(true)}
      >
        <User className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Contato</span>
      </Badge>
    </ContactPopover>
  );
}




