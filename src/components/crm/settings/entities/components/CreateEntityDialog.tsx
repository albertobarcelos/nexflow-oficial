import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEntities } from "../hooks/useEntities";
import { EntityFormContent } from "./dialog/EntityFormContent";
import { EntityFormFooter } from "./form/EntityFormFooter";
import { useEntityForm } from "./dialog/useEntityForm";
import type { CreateEntityDialogProps } from "../types";

export function CreateEntityDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  entityToEdit 
}: CreateEntityDialogProps) {
  const { entities, refetch } = useEntities();
  const {
    isLoading,
    singularName,
    pluralName,
    description,
    fields,
    selectedIcon,
    selectedColor,
    setSingularName,
    setPluralName,
    setDescription,
    setFields,
    setSelectedIcon,
    setSelectedColor,
    handleSubmit
  } = useEntityForm({ 
    entityToEdit, 
    onSuccess: async () => {
      await refetch();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[950px] max-h-[90vh] w-full flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{entityToEdit ? 'Editar Entidade' : 'Nova Entidade'}</DialogTitle>
        </DialogHeader>
        
        <EntityFormContent
          singularName={singularName}
          pluralName={pluralName}
          description={description}
          selectedIcon={selectedIcon}
          selectedColor={selectedColor}
          fields={fields}
          entities={entities || []}
          entityToEdit={entityToEdit}
          onSingularNameChange={(value) => {
            setSingularName(value);
            if (!pluralName) {
              setPluralName(value + 's');
            }
          }}
          onPluralNameChange={setPluralName}
          onDescriptionChange={setDescription}
          onIconChange={setSelectedIcon}
          onColorChange={setSelectedColor}
          setFields={setFields}
        />

        <div className="p-6 border-t mt-auto">
          <EntityFormFooter
            isLoading={isLoading}
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
            entityToEdit={entityToEdit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}