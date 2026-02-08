import { AnimatePresence, motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { KanbanCardPreview } from "./KanbanCardPreview";
import { CardCelebrationSparkles } from "./CardCelebration";
import Confetti from "react-confetti-boom";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { NexflowCard } from "@/types/nexflow";
import type { NexflowStepWithFields } from "@/hooks/useNexflowFlows";

interface SortableCardProps {
  card: NexflowCard;
  onClick: () => void;
  stepId: string;
  isActiveDrag: boolean;
  shouldShake: boolean;
  isCelebrating: boolean;
  showConfetti?: boolean;
  currentStep?: NexflowStepWithFields | null;
}

export function SortableCard({
  card,
  onClick,
  stepId,
  isActiveDrag,
  shouldShake,
  isCelebrating,
  showConfetti = false,
  currentStep,
}: SortableCardProps) {
  const isFrozenCard = currentStep?.stepType === 'freezing';
  const cardRef = useRef<HTMLDivElement>(null);
  const [confettiPosition, setConfettiPosition] = useState<{ x: number; y: number } | null>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { stepId } });

  // Combinar refs
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    cardRef.current = node;
  };

  useEffect(() => {
    if (showConfetti && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      setConfettiPosition({ x, y });
    } else {
      setConfettiPosition(null);
    }
  }, [showConfetti]);

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
    <>
      {showConfetti && confettiPosition && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
          <Confetti
            mode="boom"
            particleCount={200}
            effectCount={2}
            colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FF1493', '#00CED1', '#FF6347', '#32CD32']}
            effectInterval={100}
            x={confettiPosition.x}
            y={confettiPosition.y}
            shapeSize={10}
            launchSpeed={2}
          />
        </div>,
        document.body
      )}
      <motion.div
        ref={combinedRef}
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
        "relative cursor-pointer rounded-lg border border-gray-100  bg-white  p-3 shadow-sm transition-all group",
        isActiveDrag ? "opacity-40" : "opacity-100",
        shouldShake 
          ? "ring-2 ring-red-300 bg-red-50/60" 
          : "hover:shadow-md transition-shadow",
        card.status === "completed" && "bg-green-50/30  border-green-200  relative overflow-hidden",
        card.status === "canceled" && "bg-red-50/30  border-red-200  relative overflow-hidden",
        isFrozenCard && "bg-blue-50/30  border-blue-200  ring-2 ring-blue-300  relative overflow-hidden"
      )}
      onClick={onClick}
    >
      {card.status === "completed" && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent  pointer-events-none rounded-xl" />
      )}
      
      {card.status === "canceled" && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-transparent  pointer-events-none rounded-xl" />
      )}

      {isFrozenCard && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-cyan-100/20 to-transparent   pointer-events-none rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none rounded-xl" />
        </>
      )}

      <KanbanCardPreview card={card} />

      <AnimatePresence>
        {isCelebrating ? <CardCelebrationSparkles /> : null}
      </AnimatePresence>
    </motion.div>
    </>
  );
}

