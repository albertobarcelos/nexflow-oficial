import { Save, ArrowRight, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SaveStatus } from "../types";

interface CardActionsProps {
  saveStatus: SaveStatus;
  isMoving: boolean;
  isMoveDisabled: boolean;
  hasNextStep: boolean;
  hasPreviousStep: boolean;
  isDisabled: boolean;
  onSave: () => void;
  onMoveNext: () => void;
  onMoveBack: () => void;
  onDelete: () => void;
}

export function CardActions({
  saveStatus,
  isMoving,
  isMoveDisabled,
  hasNextStep,
  hasPreviousStep,
  isDisabled,
  onSave,
  onMoveNext,
  onMoveBack,
  onDelete,
}: CardActionsProps) {
  return (
    <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={saveStatus === "saving" || isDisabled}
        className="flex items-center gap-2"
      >
        {saveStatus === "saving" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : saveStatus === "saved" ? (
          <>
            <Save className="h-4 w-4 text-green-600" />
            Salvo!
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar
          </>
        )}
      </Button>

      {hasPreviousStep && (
        <Button
          variant="outline"
          size="sm"
          onClick={onMoveBack}
          disabled={isMoving || isDisabled}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar Etapa
        </Button>
      )}

      {hasNextStep && (
        <Button
          size="sm"
          onClick={onMoveNext}
          disabled={isMoveDisabled || isMoving || isDisabled}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isMoving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Movendo...
            </>
          ) : (
            <>
              Avançar Etapa
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      )}

      <div className="flex-1" />

      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={isDisabled}
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Deletar
      </Button>
    </div>
  );
}

