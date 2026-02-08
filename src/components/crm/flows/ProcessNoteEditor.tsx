import { MarkdownPreview } from "./MarkdownPreview";
import { cn } from "@/lib/utils";

interface ProcessNoteEditorProps {
  /** Valor do conteúdo em Markdown */
  value: string;
  /** Callback quando o valor muda */
  onChange: (value: string) => void;
  /** Placeholder do textarea */
  placeholder?: string;
  /** Altura mínima do textarea (em px) */
  minHeight?: number;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Editor com preview em tempo real estilo Notion para notas em Markdown.
 * Layout split: Textarea à esquerda, preview à direita.
 */
export function ProcessNoteEditor({
  value,
  onChange,
  placeholder = "Digite em Markdown... *itálico*, **negrito**, listas, etc.",
  minHeight = 120,
  className,
}: ProcessNoteEditorProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-4 border border-border rounded-xl overflow-hidden bg-background",
        className
      )}
    >
      <div className="p-3 border-r border-border">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border-0 bg-transparent px-0 py-0 text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0",
            "resize-none"
          )}
          style={{ minHeight: `${minHeight}px` }}
        />
      </div>
      <div className="p-3 overflow-y-auto max-h-[200px] custom-scrollbar">
        <MarkdownPreview content={value} />
      </div>
    </div>
  );
}
