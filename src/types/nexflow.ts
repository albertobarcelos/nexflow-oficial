import { Json } from "@/types/database";

export type FlowCategory = "finance" | "onboarding" | "generic";

export type StepFieldType =
  | "text"
  | "number"
  | "date"
  | "checklist"
  | "file"
  | "user_select";

export type FlowAccessRole = "viewer" | "editor" | "admin";

export type ActionType = "phone_call" | "email" | "linkedin_message" | "whatsapp" | "meeting" | "task";

export type StepType = "standard" | "finisher" | "fail" | "freezing";

export interface NexflowFlow {
  id: string;
  name: string;
  description?: string | null;
  category: FlowCategory;
  isActive: boolean;
  ownerId: string | null;
  clientId: string;
  createdAt: string;
}

export interface NexflowStep {
  id: string;
  flowId: string;
  title: string;
  position: number;
  color: string;
  isCompletionStep?: boolean;
  stepType?: StepType;
  createdAt: string;
  responsibleUserId?: string | null;
  responsibleTeamId?: string | null;
}

export interface StepFieldConfiguration extends Record<string, Json | undefined> {
  items?: string[];
  placeholder?: string;
  helperText?: string;
  variant?: "short" | "long";
  minLength?: number;
  maxLength?: number;
  validation?: "none" | "email" | "phone" | "cnpj_cpf";
  cnpjCpfType?: "auto" | "cpf" | "cnpj";
}

export interface NexflowStepField {
  id: string;
  stepId: string;
  label: string;
  slug?: string | null;
  fieldType: StepFieldType;
  isRequired: boolean;
  position: number;
  configuration: StepFieldConfiguration;
  createdAt: string;
}

export type StepFieldValueMap = Record<string, Json | undefined>;
export type ChecklistProgressMap = Record<string, Json | undefined>;

export interface CardMovementEntry {
  id: string;
  fromStepId: string | null;
  toStepId: string;
  movedAt: string;
  movedBy?: string | null;
  // Informações adicionais do details
  fromStepTitle?: string | null;
  toStepTitle?: string | null;
  userName?: string | null;
  actionType?: string;
  movementDirection?: "forward" | "backward" | "same";
  fromStepPosition?: number | null;
  toStepPosition?: number | null;
  details?: Record<string, unknown>;
}

export interface NexflowCard {
  id: string;
  flowId: string;
  stepId: string;
  clientId: string;
  title: string;
  fieldValues: StepFieldValueMap;
  checklistProgress: ChecklistProgressMap;
  movementHistory: CardMovementEntry[];
  parentCardId: string | null;
  assignedTo?: string | null;
  assignedTeamId?: string | null;
  assigneeType?: 'user' | 'team' | 'unassigned';
  agents?: string[];
  contactId?: string | null;
  indicationId?: string | null;
  position: number;
  status?: string | null;
  createdAt: string;
  linkedActions?: CardStepAction[]; // Processos vinculados ao card
  cardType?: 'finance' | 'onboarding';
  product?: string | null;
  value?: number | null;
  lead?: string | null;
}

export interface NexflowFlowAccess {
  id: string;
  flowId: string;
  userId: string;
  role: FlowAccessRole;
}

export interface NexflowStepVisibility {
  id: string;
  stepId: string;
  userId: string;
  canView: boolean;
  canEditFields: boolean;
}

export interface FlowTag {
  id: string;
  flow_id: string;
  name: string;
  color: string;
  created_at: string;
}

// Tipos para Step Actions (Processos)
export interface StepActionSettings {
  allowNotes?: boolean;
  requiredCompletion?: boolean;
  [key: string]: Json | undefined;
}

export interface NexflowStepAction {
  id: string;
  stepId: string;
  dayOffset: number;
  position: number;
  title: string;
  actionType: ActionType;
  description?: string | null;
  scriptTemplate?: string | null;
  checklistItems: string[];
  isRequired: boolean;
  settings: StepActionSettings;
  createdAt: string;
  updatedAt: string;
}

// Agrupamento de ações por day_offset
export interface StepActionsByDay {
  dayOffset: number;
  actions: NexflowStepAction[];
}

// Status de execução de uma ação vinculada a um card
export type CardStepActionStatus = "pending" | "in_progress" | "completed" | "skipped";

// Vinculação entre card e step_action (processo)
export interface CardStepAction {
  id: string;
  cardId: string;
  stepActionId: string;
  stepId: string;
  status: CardStepActionStatus;
  scheduledDate: string | null;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
  executionData: Record<string, Json | undefined>;
  createdAt: string;
  updatedAt: string;
}

// Automação para criar card filho quando card entra em etapa
export interface StepChildCardAutomation {
  id: string;
  stepId: string;
  clientId: string;
  targetFlowId: string;
  targetStepId: string;
  isActive: boolean;
  copyFieldValues: boolean;
  copyAssignment: boolean;
  createdAt: string;
  updatedAt: string;
}
