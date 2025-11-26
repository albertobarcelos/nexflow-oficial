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
  createdAt: string;
}

export interface StepFieldConfiguration extends Record<string, Json | undefined> {
  items?: string[];
  placeholder?: string;
  helperText?: string;
  variant?: "short" | "long";
  minLength?: number;
  maxLength?: number;
  validation?: "none" | "email" | "phone";
}

export interface NexflowStepField {
  id: string;
  stepId: string;
  label: string;
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
  position: number;
  createdAt: string;
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

