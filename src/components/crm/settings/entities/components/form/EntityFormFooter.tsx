import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Entity } from "../../types";

interface EntityFormFooterProps {
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  entityToEdit?: Entity | null;
}

export function EntityFormFooter({ 
  isLoading, 
  onCancel, 
  onSubmit,
  entityToEdit 
}: EntityFormFooterProps) {
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      await onSubmit();
      toast({
        title: entityToEdit ? "Entidade atualizada" : "Entidade criada",
        description: entityToEdit ? 
          "A entidade foi atualizada com sucesso." : 
          "A entidade foi criada com sucesso."
      });
    } catch (error) {
      console.error('Error saving entity:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a entidade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex justify-end gap-3 px-6 py-4 border-t bg-background">
      <Button 
        type="button"
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading}
        className="min-w-[100px]"
      >
        Cancelar
      </Button>
      <Button 
        type="submit"
        disabled={isLoading}
        onClick={handleSubmit}
        className="min-w-[140px]"
      >
        {isLoading ? "Salvando..." : entityToEdit ? "Salvar Alterações" : "Criar Entidade"}
      </Button>
    </div>
  );
}