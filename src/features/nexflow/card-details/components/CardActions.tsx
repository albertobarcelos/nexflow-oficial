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
    <div className="px-8 py-5 border-t border-slate-100  flex justify-between items-center shrink-0 bg-white ">
      <div className="flex gap-3">
        <button
          onClick={onDelete}
          disabled={isDisabled}
          className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-red-200  disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-5 w-5" />
          Deletar
        </button>

      </div>


      <div className="flex gap-2 ">
          {hasPreviousStep && (
          <button
            onClick={onMoveBack}
            disabled={isMoving || isDisabled}
            className="px-5 py-2.5 rounded-xl border border-slate-200  text-slate-700  font-bold text-sm flex items-center gap-2 hover:bg-slate-50 :bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar Etapa
          </button>
        )}

          {hasNextStep && (
            <button
              onClick={onMoveNext}
              disabled={isMoveDisabled || isMoving || isDisabled}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200  disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMoving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Movendo...
                </>
              ) : (
                <>
                  Avançar Etapa
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          )}
        </div>

      <button
        onClick={onSave}
        disabled={saveStatus === "saving" || isDisabled}
        className="px-5 py-2.5 rounded-xl border border-slate-200  text-slate-700  font-bold text-sm flex items-center gap-2 hover:bg-slate-50 :bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saveStatus === "saving" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Salvando...
          </>
        ) : saveStatus === "saved" ? (
          <>
            <Save className="h-5 w-5 text-green-600" />
            Salvo!
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Salvar
          </>
        )}
      </button>
    </div>
  );
}

