import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";

interface ColumnDropZoneProps {
  stepId: string;
  children: ReactNode;
}

export function ColumnDropZone({ stepId, children }: ColumnDropZoneProps) {
  const { setNodeRef } = useDroppable({
    id: `column-${stepId}`,
    data: { stepId },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-1 flex-col gap-2"
      style={{ minHeight: "calc(100vh - 360px)" }}
    >
      {children}
    </div>
  );
}

