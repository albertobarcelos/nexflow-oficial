import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface EntityFormFooterProps {
  isLoading: boolean;
  onCancel: () => void;
  entityToEdit?: any;
}

export function EntityFormFooter({ isLoading, onCancel, entityToEdit }: EntityFormFooterProps) {
  return (
    <DialogFooter className="fixed bottom-0 right-0 left-0 p-4 bg-background border-t flex justify-end space-x-2">
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancelar
      </Button>
      <Button 
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Salvando..." : entityToEdit ? "Salvar Alterações" : "Criar Entidade"}
      </Button>
    </DialogFooter>
  );
}