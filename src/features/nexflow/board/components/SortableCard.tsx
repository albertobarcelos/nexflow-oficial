import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X, Snowflake } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { KanbanCardPreview } from "./KanbanCardPreview";
import { CardCelebrationSparkles } from "./CardCelebration";
import type { NexflowCard, NexflowStepWithFields } from "@/types/nexflow";

interface SortableCardProps {
  card: NexflowCard;
  onClick: () => void;
  stepId: string;
  isActiveDrag: boolean;
  shouldShake: boolean;
  isCelebrating: boolean;
  currentStep?: NexflowStepWithFields | null;
}

export function SortableCard({
  card,
  onClick,
  stepId,
  isActiveDrag,
  shouldShake,
  isCelebrating,
  currentStep,
}: SortableCardProps) {
  const isFrozenCard = currentStep?.stepType === 'freezing';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { stepId } });

  const appliedStyle = {
    transition,
  };

  const baseTransform = transform ? CSS.Transform.toString(transform) : "";
  const transformed = isDragging
    ? `${baseTransform} scale(1.03) rotate(-2deg)`
    : baseTransform;

  const animateProps = {
    boxShadow: isDragging
      ? "0px 22px 45px rgba(15,23,42,0.25)"
      : "0px 6px 18px rgba(15,23,42,0.08)",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={
        {
          ...(appliedStyle as React.CSSProperties),
          transform: transformed,
        } as React.CSSProperties
      }
      {...attributes}
      {...listeners}
      layoutId={card.id}
      animate={animateProps}
      transition={{
        duration: shouldShake ? 0.45 : 0.2,
        type: shouldShake ? "tween" : "spring",
        stiffness: 260,
        damping: 20,
      }}
      className={cn(
        "relative cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition-all group",
        isActiveDrag ? "opacity-40" : "opacity-100",
        shouldShake 
          ? "ring-2 ring-red-300 bg-red-50/60" 
          : "hover:shadow-md hover:-translate-y-0.5",
        card.status === "completed" && "bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 relative overflow-hidden",
        card.status === "canceled" && "bg-red-50/30 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 relative overflow-hidden",
        isFrozenCard && "bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 ring-2 ring-blue-300 dark:ring-blue-700/50 relative overflow-hidden"
      )}
      onClick={onClick}
    >
      {card.status === "completed" && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent dark:from-green-900/10 pointer-events-none rounded-xl" />
      )}
      
      {card.status === "canceled" && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-transparent dark:from-red-900/10 pointer-events-none rounded-xl" />
      )}

      {isFrozenCard && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-cyan-100/20 to-transparent dark:from-blue-900/20 dark:via-cyan-900/10 pointer-events-none rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none rounded-xl" />
        </>
      )}
      
      {card.status === "completed" && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            <CheckCircle2 className="h-3 w-3" />
            <span>Concluído</span>
          </div>
        </div>
      )}

      {card.status === "canceled" && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            <X className="h-3 w-3" />
            <span>Cancelado</span>
          </div>
        </div>
      )}

      {isFrozenCard && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
            <Snowflake className="h-3 w-3" />
            <span>Congelado</span>
          </div>
        </div>
      )}

      <KanbanCardPreview card={card} />

      <AnimatePresence>
        {isCelebrating ? <CardCelebrationSparkles /> : null}
      </AnimatePresence>
    </motion.div>
  );
}

