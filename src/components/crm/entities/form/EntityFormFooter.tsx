import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface EntityFormFooterProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

export function EntityFormFooter({ isSubmitting, onCancel }: EntityFormFooterProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="transition-colors hover:bg-secondary"
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="min-w-[120px] relative"
      >
        {isSubmitting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </motion.div>
        ) : (
          "Salvar"
        )}
      </Button>
    </div>
  );
}