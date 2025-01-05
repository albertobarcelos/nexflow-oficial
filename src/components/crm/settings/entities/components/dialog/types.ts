import { Entity } from "../../types";
import { EntityField } from "../../types";

export interface EntityFormState {
  singularName: string;
  pluralName: string;
  description: string;
  fields: EntityField[];
  selectedIcon: string;
  selectedColor: string;
}

export interface UseEntityFormProps {
  entityToEdit: Entity | null;
  onSuccess?: () => Promise<void>;
}

export interface EntityFormValidation {
  isValid: boolean;
  errors: {
    singularName?: string;
    pluralName?: string;
    fields?: string;
  };
}