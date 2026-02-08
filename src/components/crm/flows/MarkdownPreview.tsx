import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  /** Conteúdo em Markdown a ser renderizado */
  content: string;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente para exibir preview de conteúdo Markdown com suporte a GFM
 * (tabelas, listas, strikethrough, etc.)
 */
export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  if (!content?.trim()) {
    return (
      <p className={cn("text-sm text-muted-foreground italic", className)}>
        Nenhum conteúdo
      </p>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-foreground",
        "prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
