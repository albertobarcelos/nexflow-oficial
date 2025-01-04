import { Button } from "@/components/ui/button";

interface EntityFormFooterProps {
  isLoading: boolean;
  onCancel: () => void;
  entityToEdit?: any;
}

export function EntityFormFooter({ isLoading, onCancel, entityToEdit }: EntityFormFooterProps) {
  return (
    <div className="flex justify-end space-x-2">
      <Button 
        type="button"
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
    </div>
  );
}