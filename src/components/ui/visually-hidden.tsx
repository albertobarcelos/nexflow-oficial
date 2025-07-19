// AIDEV-NOTE: Componente para ocultar visualmente elementos mantendo acessibilidade para screen readers

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Componente que oculta visualmente o conteúdo mas mantém acessível para screen readers
 * Usado para cumprir requisitos de acessibilidade do Radix UI
 */
const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      "clip-path-[inset(50%)]", // Equivalente a clip: rect(0 0 0 0)
      className
    )}
    style={{
      clip: "rect(0 0 0 0)",
      clipPath: "inset(50%)",
    }}
    {...props}
  />
))
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }