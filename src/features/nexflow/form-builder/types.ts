import type { FieldConfiguration } from "@/types/form-builder";

export interface FormBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

export interface FormBuilderState {
  activeTab: string;
  formTitle: string;
  selectedField: FieldConfiguration | null;
  configModalOpen: boolean;
  pendingField: FieldConfiguration | null;
  selectedStageId: string | null;
  hasUnsavedChanges: boolean;
}

