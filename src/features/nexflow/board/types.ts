import type { NexflowCard, NexflowStep } from "@/types/nexflow";

export type ViewMode = "kanban" | "list";

export interface BoardFilters {
  userId: string | null;
  teamId: string | null;
}

export interface CardsByStep {
  [stepId: string]: NexflowCard[];
}

export interface CardsByStepPaginated {
  [stepId: string]: {
    cards: NexflowCard[];
    total: number;
    hasMore: boolean;
  };
}

export interface StepCounts {
  [stepId: string]: number;
}

