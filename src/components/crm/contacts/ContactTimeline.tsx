import { ContactHistoryVertical } from "./ContactHistoryVertical";

interface ContactTimelineProps {
  contactId: string | null;
}

export function ContactTimeline({ contactId }: ContactTimelineProps) {
  return <ContactHistoryVertical contactId={contactId} />;
}
