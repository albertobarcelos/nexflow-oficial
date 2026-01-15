import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";

export interface ModularField {
  id: string; // UUID do campo de modulagem
  description: string; // Descrição (ex: "Delivery")
  value: number; // Valor da modulagem
}

export interface CardProduct {
  id: string; // UUID gerado no frontend
  itemId: string; // ID do produto selecionado (web_items)
  itemName: string; // Snapshot do nome do produto
  itemPrice: number; // Preço base do produto
  modularFields: ModularField[]; // Campos de modulagem
  totalValue: number; // itemPrice + soma das modulagens
  isModularEnabled?: boolean; // Flag para controlar se modulagem está ativada
}

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
  products?: CardProduct[]; // Array de produtos com modulagem
}

export type SaveStatus = "idle" | "saving" | "saved";
export type ActiveSection = "overview" | "history" | "fields" | "attachments" | "comments" | "processes" | "activities" | "products";

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

