import { EntityFormState, EntityFormValidation } from "./types";

export function useEntityFormValidation(formState: EntityFormState) {
  const validateForm = (): EntityFormValidation => {
    const errors: EntityFormValidation["errors"] = {};
    
    if (!formState.singularName.trim()) {
      errors.singularName = "Nome singular é obrigatório";
    }
    
    if (!formState.pluralName.trim()) {
      errors.pluralName = "Nome plural é obrigatório";
    }
    
    if (!formState.fields.length) {
      errors.fields = "Pelo menos um campo é necessário";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  return { validateForm };
}