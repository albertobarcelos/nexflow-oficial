import * as React from "react";
import { GripHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Altura aproximada de uma linha de texto (px) para cálculo de min/default height */
const ROW_HEIGHT_PX = 24;

export interface ResizableTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "rows" | "style"
  > {
  /** Número de linhas na altura inicial */
  defaultRows?: number;
  /** Número mínimo de linhas (altura mínima) */
  minRows?: number;
  /** Altura máxima em pixels (ex.: 400) */
  maxHeight?: number;
  /** ID opcional para persistir altura no sessionStorage durante a sessão */
  fieldId?: string;
  className?: string;
}

const STORAGE_KEY_PREFIX = "resizable-textarea-height-";

/**
 * Textarea com handle na parte inferior para redimensionar a altura por arraste.
 * Usado em campos de texto longo e texto curto no formulário do card.
 */
const ResizableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ResizableTextareaProps
>(
  (
    {
      defaultRows = 4,
      minRows = 2,
      maxHeight = 400,
      fieldId,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const minHeightPx = minRows * ROW_HEIGHT_PX;
    const defaultHeightPx = defaultRows * ROW_HEIGHT_PX;

    // Restaura altura do sessionStorage ou usa default
    const [height, setHeight] = React.useState(() => {
      if (fieldId && typeof window !== "undefined") {
        const stored = sessionStorage.getItem(STORAGE_KEY_PREFIX + fieldId);
        if (stored) {
          const num = Number.parseInt(stored, 10);
          if (!Number.isNaN(num)) return Math.min(maxHeight, Math.max(minHeightPx, num));
        }
      }
      return defaultHeightPx;
    });

    const startYRef = React.useRef(0);
    const startHeightRef = React.useRef(0);

    const setRefs = React.useCallback(
      (el: HTMLTextAreaElement | null) => {
        textareaRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      },
      [ref]
    );

    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        startYRef.current = e.clientY;
        startHeightRef.current = height;

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaY = moveEvent.clientY - startYRef.current;
          const newHeight = Math.min(
            maxHeight,
            Math.max(minHeightPx, startHeightRef.current + deltaY)
          );
          setHeight(newHeight);
          if (fieldId && typeof window !== "undefined") {
            sessionStorage.setItem(STORAGE_KEY_PREFIX + fieldId, String(newHeight));
          }
        };

        const onMouseUp = () => {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      },
      [disabled, height, fieldId, maxHeight, minHeightPx]
    );

    return (
      <div className="relative rounded-md shadow-sm">
        <Textarea
          ref={setRefs}
          disabled={disabled}
          className={cn(
            "block w-full rounded-t-lg rounded-b-none border-b-0 py-3 px-4 transition-shadow resize-none disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          style={{ height: `${height}px`, minHeight: `${minHeightPx}px` }}
          {...props}
        />
        {/* Handle para redimensionar altura (arrastar para baixo aumenta) */}
        <div
          role="separator"
          aria-label="Redimensionar altura do campo"
          onMouseDown={handleMouseDown}
          className={cn(
            "flex items-center justify-center rounded-b-lg border border-t-0 border-input bg-muted/30 cursor-ns-resize select-none touch-none",
            "hover:bg-muted/50 focus:outline-none",
            disabled && "pointer-events-none opacity-50"
          )}
          style={{ minHeight: "28px" }}
        >
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }
);

ResizableTextarea.displayName = "ResizableTextarea";

export { ResizableTextarea };
