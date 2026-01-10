import type { NexflowCard, NexflowStepWithFields } from "@/types/nexflow";

export interface CardFormValues {
  title: string;
  fields: Record<string, string>;
  checklist: Record<string, Record<string, boolean>>;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  assigneeType?: 'user' | 'team' | 'unassigned';
  agents?: string[];
  product?: string | null;
  value?: number | null;
}

export type SaveStatus = "idle" | "saving" | "saved";
export type ActiveSection = "overview" | "history" | "fields" | "attachments" | "comments" | "processes";

export interface CardDetailsModalProps {
  card: NexflowCard | null;
  steps: NexflowStepWithFields[];
  onClose: () => void;
  onSave: (card: NexflowCard, values: CardFormValues) => Promise<void>;
  onMoveNext: (card: NexflowCard, values: CardFormValues) => Promise<void>;
  onDelete?: (cardId: string) => Promise<void>;
  onUpdateCard?: (input: {
    id: string;
    stepId?: string;
  }) => Promise<void>;
  subtaskCount: number;
  parentTitle?: string | null;
  onOpenParentCard?: (card: NexflowCard) => void;
  currentFlowId?: string;
}

