import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UseEntityFormProps } from "./types";
import { useEntityFormState } from "./useEntityFormState";
import { useEntityFormValidation } from "./useEntityFormValidation";
import { useEntityFormOperations } from "./useEntityFormOperations";

export function useEntityForm({ entityToEdit, onSuccess }: UseEntityFormProps) {
  const { toast } = useToast();
  const { formState, setFormState } = useEntityFormState(entityToEdit);
  const { validateForm } = useEntityFormValidation(formState);
  const { 
    isLoading, 
    setIsLoading, 
    handleEntityUpdate, 
    handleEntityCreate 
  } = useEntityFormOperations(entityToEdit);

  const handleSubmit = async () => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      Object.values(validation.errors).forEach(error => {
        if (error) {
          toast({
            title: "Erro de validação",
            description: error,
            variant: "destructive"
          });
        }
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting save operation...");
      
      const { data: collaborator } = await supabase
        .from('collaborators')
        .select('client_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!collaborator) throw new Error('Cliente não encontrado');

      if (entityToEdit) {
        await handleEntityUpdate(entityToEdit.id, collaborator.client_id, formState);
      } else {
        await handleEntityCreate(collaborator.client_id, formState);
      }
      
      console.log("Save operation completed successfully");
      
      toast({
        title: entityToEdit ? "Entidade atualizada" : "Entidade criada",
        description: entityToEdit ? 
          "A entidade foi atualizada com sucesso." : 
          "A entidade foi criada com sucesso."
      });
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Error saving entity:', error);
      toast({
        title: "Erro ao salvar entidade",
        description: "Ocorreu um erro ao salvar a entidade. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    singularName: formState.singularName,
    pluralName: formState.pluralName,
    description: formState.description,
    fields: formState.fields,
    selectedIcon: formState.selectedIcon,
    selectedColor: formState.selectedColor,
    setSingularName: (value: string) => 
      setFormState(prev => ({ ...prev, singularName: value })),
    setPluralName: (value: string) => 
      setFormState(prev => ({ ...prev, pluralName: value })),
    setDescription: (value: string) => 
      setFormState(prev => ({ ...prev, description: value })),
    setFields: (fields: any[]) => 
      setFormState(prev => ({ ...prev, fields })),
    setSelectedIcon: (value: string) => 
      setFormState(prev => ({ ...prev, selectedIcon: value })),
    setSelectedColor: (value: string) => 
      setFormState(prev => ({ ...prev, selectedColor: value })),
    handleSubmit
  };
}